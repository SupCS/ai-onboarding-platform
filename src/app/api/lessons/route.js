import { buildTheoreticalLessonPrompt } from '../../../lib/lessonPrompt';
import { generateLessonContent } from '../../../lib/lessonGenerator';
import {
  createLessonDraft,
  getAllLessons,
  markLessonFailed,
  markLessonGenerating,
  markLessonReady,
} from '../../../lib/lessons';
import { extractHtmlTitle, looksLikeHtml, markdownToHtml } from '../../../lib/lessonContent';
import { loadAndPrepareMaterialsForLesson } from '../../../lib/materialPreparation';
import { updateMaterialFileOpenAIUpload } from '../../../lib/materials';
import {
  getOpenAIFileInputType,
  getOpenAIFilePurpose,
  uploadMaterialFileToOpenAI,
} from '../../../lib/openaiFiles';
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

async function prepareOpenAIFileInputs(preparedMaterials) {
  const fileInputs = [];
  const attachedFiles = [];

  for (const material of preparedMaterials.materials) {
    for (const attachment of material.attachments || []) {
      const inputType = getOpenAIFileInputType(attachment);

      if (!inputType) {
        continue;
      }

      try {
        let openaiFileId = attachment.openaiFileId;
        let openaiFilePurpose = attachment.openaiFilePurpose || getOpenAIFilePurpose(attachment);

        if (!openaiFileId) {
          const upload = await uploadMaterialFileToOpenAI(attachment);

          if (!upload?.id) {
            continue;
          }

          openaiFileId = upload.id;
          openaiFilePurpose = upload.purpose;

          await updateMaterialFileOpenAIUpload(attachment.id, {
            openaiFileId,
            openaiFilePurpose,
            openaiFileStatus: 'uploaded',
            openaiFileError: '',
          });
        }

        attachment.openaiFileId = openaiFileId;
        attachment.openaiFilePurpose = openaiFilePurpose;
        attachment.openaiFileStatus = 'uploaded';
        attachment.openaiFileError = '';

        fileInputs.push({
          type: inputType,
          file_id: openaiFileId,
        });
        attachedFiles.push({
          materialId: material.id,
          materialTitle: material.title,
          attachmentId: attachment.id,
          name: attachment.name,
          mimeType: attachment.mimeType,
          inputType,
          openaiFileId,
          openaiFilePurpose,
        });
      } catch (error) {
        attachment.openaiFileStatus = 'failed';
        attachment.openaiFileError = error.message || 'OpenAI file upload failed.';

        await updateMaterialFileOpenAIUpload(attachment.id, {
          openaiFileId: attachment.openaiFileId || '',
          openaiFilePurpose: attachment.openaiFilePurpose || getOpenAIFilePurpose(attachment),
          openaiFileStatus: 'failed',
          openaiFileError: attachment.openaiFileError,
        });

        throw new Error(`Failed to attach "${attachment.name}" to OpenAI: ${attachment.openaiFileError}`);
      }
    }
  }

  return {
    fileInputs,
    attachedFiles,
  };
}

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const lessons = await getAllLessons(user.id);

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

    if (action === 'generate') {
      const preparedMaterials = await loadAndPrepareMaterialsForLesson(materialIds);
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
      let promptVersion = 'file-input-preparation-or-generation';
      let attachedFiles = [];

      try {
        const filePreparation = await prepareOpenAIFileInputs(preparedMaterials);
        const fileInputs = filePreparation.fileInputs;
        attachedFiles = filePreparation.attachedFiles;
        const prompt = buildTheoreticalLessonPrompt({
          preparedMaterials,
          fileInputs,
          userInstructions,
          depth,
          tone,
          desiredFormat,
        });
        promptVersion = prompt.version;

        await markLessonGenerating(lesson.id, {
          promptVersion: prompt.version,
          preparedMaterials: serializePreparedMaterials(preparedMaterials),
          attachedFiles,
        });

        const generatedLesson = await generateLessonContent(prompt);
        const generatedContent = generatedLesson.content;
        const generatedHtml = looksLikeHtml(generatedContent)
          ? generatedContent
          : markdownToHtml(generatedContent);
        const readyLesson = await markLessonReady(lesson.id, {
          title:
            extractHtmlTitle(generatedHtml) ||
            extractMarkdownTitle(generatedContent),
          contentMarkdown: generatedContent,
          contentHtml: generatedHtml,
          generationMetadata: {
            ...generatedLesson.metadata,
            preparedMaterials: serializePreparedMaterials(preparedMaterials),
            attachedFiles,
          },
        });

        console.log('Generated theoretical lesson:', {
          lessonId: readyLesson.id,
          promptVersion: prompt.version,
          contentHtml: readyLesson.contentHtml,
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
            promptVersion,
            preparedMaterials: serializePreparedMaterials(preparedMaterials),
            attachedFiles,
            failedAt: new Date().toISOString(),
          },
          errorMessage: generationError.message || 'Lesson generation failed.',
        });

        throw Object.assign(generationError, {
          lesson: failedLesson,
        });
      }
    }

    const preparedMaterials = await loadAndPrepareMaterialsForLesson(materialIds);
    const prompt = buildTheoreticalLessonPrompt({
      preparedMaterials,
      userInstructions,
      depth,
      tone,
      desiredFormat,
    });

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
