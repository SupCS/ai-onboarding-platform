import { buildTheoreticalLessonPrompt } from '../../../lib/lessonPrompt';
import { generateLessonMarkdown } from '../../../lib/lessonGenerator';
import {
  createLessonDraft,
  getAllLessons,
  markLessonFailed,
  markLessonGenerating,
  markLessonReady,
} from '../../../lib/lessons';
import { markdownToHtml } from '../../../lib/lessonContent';
import { loadAndPrepareMaterialsForLesson } from '../../../lib/materialPreparation';
import { requireApiUser } from '../../../lib/apiAuth';

export const runtime = 'nodejs';

function buildLessonTitle(sourceReferences) {
  if (sourceReferences.length === 0) {
    return 'Generating theoretical lesson';
  }

  if (sourceReferences.length === 1) {
    return sourceReferences[0].title;
  }

  if (sourceReferences.length === 2) {
    return `${sourceReferences[0].title} + ${sourceReferences[1].title}`;
  }

  return `${sourceReferences[0].title} and ${sourceReferences.length - 1} more materials`;
}

function extractMarkdownTitle(markdown = '') {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  const title = headingMatch?.[1]?.trim();

  if (!title) {
    return '';
  }

  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

function serializePreparedMaterials(preparedMaterials) {
  return {
    sourceReferences: preparedMaterials.sourceReferences,
    extractedTerms: preparedMaterials.extractedTerms,
    signals: preparedMaterials.signals,
    overlaps: preparedMaterials.overlaps,
    stats: preparedMaterials.stats,
  };
}

export async function GET() {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
    }

    const lessons = await getAllLessons();

    return Response.json({ lessons });
  } catch (error) {
    console.error('GET /api/lessons failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load lessons.' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const body = await request.json();
    const action = body.action || 'build-prompt';
    const materialIds = Array.isArray(body.materialIds) ? body.materialIds : [];
    const userInstructions = (body.userInstructions || '').trim();
    const depth = (body.depth || 'standard').trim();
    const tone = (body.tone || 'clear').trim();
    const desiredFormat = (body.desiredFormat || 'structured theoretical lesson').trim();

    if (materialIds.length === 0 && !userInstructions) {
      return Response.json(
        { error: 'Select at least one material or describe what the lesson should be about.' },
        { status: 400 }
      );
    }

    const preparedMaterials = await loadAndPrepareMaterialsForLesson(materialIds);
    const prompt = buildTheoreticalLessonPrompt({
      preparedMaterials,
      userInstructions,
      depth,
      tone,
      desiredFormat,
    });

    if (action === 'generate') {
      const lesson = await createLessonDraft({
        title: buildLessonTitle(preparedMaterials.sourceReferences),
        description:
          preparedMaterials.stats.materialCount > 0
            ? `Generated theoretical lesson from ${preparedMaterials.stats.materialCount} material(s).`
            : 'Generated theoretical lesson from prompt instructions.',
        materialIds,
        userInstructions,
        depth,
        tone,
        desiredFormat,
        createdBy: user.name,
      });

      await markLessonGenerating(lesson.id, {
        promptVersion: prompt.version,
        preparedMaterials: serializePreparedMaterials(preparedMaterials),
      });

      try {
        const generatedLesson = await generateLessonMarkdown(prompt);
        const readyLesson = await markLessonReady(lesson.id, {
          title: extractMarkdownTitle(generatedLesson.content),
          contentMarkdown: generatedLesson.content,
          contentHtml: markdownToHtml(generatedLesson.content),
          generationMetadata: {
            ...generatedLesson.metadata,
            preparedMaterials: serializePreparedMaterials(preparedMaterials),
          },
        });

        console.log('Generated theoretical lesson:', {
          lessonId: readyLesson.id,
          promptVersion: prompt.version,
          contentMarkdown: readyLesson.contentMarkdown,
        });

        return Response.json({
          lesson: readyLesson,
          prompt,
          preparedMaterials: serializePreparedMaterials(preparedMaterials),
        });
      } catch (generationError) {
        const failedLesson = await markLessonFailed(lesson.id, {
          generationMetadata: {
            provider: 'openai',
            promptVersion: prompt.version,
            preparedMaterials: serializePreparedMaterials(preparedMaterials),
            failedAt: new Date().toISOString(),
          },
          errorMessage: generationError.message || 'Lesson generation failed.',
        });

        throw Object.assign(generationError, {
          lesson: failedLesson,
        });
      }
    }

    console.log('Generated theoretical lesson prompt:', {
      promptVersion: prompt.version,
      materialIds,
      prompt,
    });

    return Response.json({
      prompt,
      preparedMaterials: serializePreparedMaterials(preparedMaterials),
    });
  } catch (error) {
    console.error('POST /api/lessons failed:', error);

    return Response.json(
      {
        error: error.message || 'Failed to build lesson prompt.',
        lesson: error.lesson || null,
      },
      { status: 500 }
    );
  }
}
