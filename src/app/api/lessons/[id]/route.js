import { requireApiUser } from '../../../../lib/apiAuth';
import {
  deleteLessonById,
  getLessonById,
  updateLessonContent,
} from '../../../../lib/lessons';
import { extractHtmlTitle, looksLikeHtml, markdownToHtml } from '../../../../lib/lessonContent';
import { generateLessonContent, generateLessonRevisionBrief } from '../../../../lib/lessonGenerator';
import {
  buildLessonRevisionPlannerPrompt,
  buildLessonRevisionWriterPrompt,
} from '../../../../lib/lessonRevision';
import { loadAndPrepareMaterialsForLesson, prepareMaterialsForLesson } from '../../../../lib/materialPreparation';

export const runtime = 'nodejs';

function sanitizeRevisionOptions(options = []) {
  const allowedOptions = new Set(['simpler', 'deeper', 'examples', 'structured', 'shorter']);

  return [...new Set(options.filter((option) => allowedOptions.has(option)))];
}

function buildRevisionHistoryEntry({
  revisionRequest,
  selectedOptions,
  revisionBrief,
  plannerPrompt,
  writerPrompt,
  plannerMetadata,
  writerMetadata,
}) {
  return {
    revisedAt: new Date().toISOString(),
    revisionRequest,
    selectedOptions,
    revisionBrief,
    plannerPrompt,
    writerPrompt,
    planner: plannerMetadata,
    writer: writerMetadata,
  };
}

function buildUpdatedGenerationMetadata(lesson, revisionEntry) {
  const metadata = lesson.generationMetadata || {};
  const revisionHistory = Array.isArray(metadata.revisionHistory)
    ? metadata.revisionHistory.slice(-9)
    : [];

  return {
    ...metadata,
    lastRevisionAt: revisionEntry.revisedAt,
    lastRevisionRequest: revisionEntry.revisionRequest,
    lastRevisionScope: revisionEntry.revisionBrief.changeScope,
    lastRevisionOptions: revisionEntry.selectedOptions,
    lastRevisionPlannerPrompt: revisionEntry.plannerPrompt,
    lastRevisionWriterPrompt: revisionEntry.writerPrompt,
    lastRevisionPlanner: revisionEntry.planner,
    lastRevisionWriter: revisionEntry.writer,
    revisionHistory: [...revisionHistory, revisionEntry],
  };
}

export async function PUT(request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const contentHtml = (body.contentHtml || '').trim();
    const title = (body.title || '').trim();

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    if (!contentHtml) {
      return Response.json(
        { error: 'Lesson content is required.' },
        { status: 400 }
      );
    }

    const lesson = await updateLessonContent(id, {
      title,
      contentHtml,
    });

    if (!lesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    return Response.json({ lesson });
  } catch (error) {
    console.error('PUT /api/lessons/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update lesson.' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const revisionRequest = (body.revisionRequest || '').trim();
    const selectedOptions = sanitizeRevisionOptions(
      Array.isArray(body.selectedOptions) ? body.selectedOptions : []
    );

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    if (!revisionRequest && selectedOptions.length === 0) {
      return Response.json(
        { error: 'Add revision notes or select at least one revision option.' },
        { status: 400 }
      );
    }

    const lesson = await getLessonById(id);

    if (!lesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    if (lesson.status !== 'ready') {
      return Response.json(
        { error: 'Only ready lessons can be revised.' },
        { status: 400 }
      );
    }

    if (!lesson.contentHtml?.trim()) {
      return Response.json(
        { error: 'Lesson content is empty.' },
        { status: 400 }
      );
    }

    const preparedMaterials = lesson.materialIds?.length
      ? await loadAndPrepareMaterialsForLesson(lesson.materialIds)
      : prepareMaterialsForLesson([]);
    const plannerPrompt = buildLessonRevisionPlannerPrompt({
      lesson,
      preparedMaterials,
      revisionRequest,
      selectedOptions,
    });
    console.group('Lesson revision planner prompt');
    console.log('Lesson id:', lesson.id);
    console.log('Lesson title:', lesson.title);
    console.log('Selected options:', selectedOptions);
    console.log('Revision request:', revisionRequest);
    console.log('Planner prompt version:', plannerPrompt.version);
    console.log('Planner prompt cache key:', plannerPrompt.cacheKey);
    console.log('Planner instructions:', plannerPrompt.instructions);
    console.log('Planner input:', plannerPrompt.input);
    console.groupEnd();
    const plannerResult = await generateLessonRevisionBrief(plannerPrompt);
    console.group('Lesson revision planner result');
    console.log('Lesson id:', lesson.id);
    console.log('Planner model:', plannerResult.metadata.model);
    console.log('Planner response id:', plannerResult.metadata.responseId);
    console.log('Planner usage:', plannerResult.metadata.usage);
    console.log('Planner brief:', plannerResult.brief);
    console.log('Planner raw output:', plannerResult.metadata.rawOutput);
    console.groupEnd();
    const writerPrompt = buildLessonRevisionWriterPrompt({
      lesson,
      preparedMaterials,
      revisionRequest,
      selectedOptions,
      revisionBrief: plannerResult.brief,
    });
    console.group('Lesson revision writer prompt');
    console.log('Lesson id:', lesson.id);
    console.log('Writer prompt version:', writerPrompt.version);
    console.log('Writer prompt cache key:', writerPrompt.cacheKey);
    console.log('Writer instructions:', writerPrompt.instructions);
    console.log('Writer input:', writerPrompt.input);
    console.groupEnd();
    const writerResult = await generateLessonContent(writerPrompt);
    console.group('Lesson revision writer result');
    console.log('Lesson id:', lesson.id);
    console.log('Writer model:', writerResult.metadata.model);
    console.log('Writer response id:', writerResult.metadata.responseId);
    console.log('Writer usage:', writerResult.metadata.usage);
    console.log('Writer content:', writerResult.content);
    console.groupEnd();
    const revisedContent = writerResult.content;
    const revisedHtml = looksLikeHtml(revisedContent)
      ? revisedContent
      : markdownToHtml(revisedContent);
    const revisedMarkdown = looksLikeHtml(revisedContent)
      ? lesson.contentMarkdown || ''
      : revisedContent;
    const revisionEntry = buildRevisionHistoryEntry({
      revisionRequest,
      selectedOptions,
      revisionBrief: plannerResult.brief,
      plannerPrompt,
      writerPrompt,
      plannerMetadata: plannerResult.metadata,
      writerMetadata: writerResult.metadata,
    });
    const updatedMetadata = buildUpdatedGenerationMetadata(lesson, revisionEntry);
    const updatedLesson = await updateLessonContent(id, {
      title: extractHtmlTitle(revisedHtml) || lesson.title,
      contentHtml: revisedHtml,
      contentMarkdown: revisedMarkdown,
      generationMetadata: updatedMetadata,
      status: 'ready',
      errorMessage: '',
    });

    return Response.json({
      lesson: updatedLesson,
      revisionBrief: plannerResult.brief,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to revise lesson.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    const deletedLesson = await deleteLessonById(id);

    if (!deletedLesson) {
      return Response.json(
        { error: 'Lesson not found.' },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error('DELETE /api/lessons/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to delete lesson.' },
      { status: 500 }
    );
  }
}
