import { requireApiUser } from '../../../../../lib/apiAuth';
import { generateLessonActivityPayload } from '../../../../../lib/lessonGenerator';
import {
  buildLessonActivityPrompt,
  normalizeActivityRequest,
  normalizeGeneratedActivityPayload,
} from '../../../../../lib/lessonActivityPrompt';
import {
  createLessonActivity,
  getLessonById,
} from '../../../../../lib/lessons';

export const runtime = 'nodejs';

function getActivityItemCount(type, payload) {
  if (type === 'flashcards') {
    return payload.cards?.length || 0;
  }

  return payload.items?.length || 0;
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const body = await request.json();
    const activityRequest = normalizeActivityRequest({
      type: body.type,
      count: body.count,
    });

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
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
        { error: 'Only ready lessons can have generated activities.' },
        { status: 400 }
      );
    }

    if (!lesson.contentHtml?.trim() && !lesson.contentMarkdown?.trim()) {
      return Response.json(
        { error: 'Lesson content is empty.' },
        { status: 400 }
      );
    }

    const prompt = buildLessonActivityPrompt({
      lesson,
      type: activityRequest.type,
      count: activityRequest.count,
    });

    console.group('Lesson activity prompt');
    console.log('Lesson id:', lesson.id);
    console.log('Lesson title:', lesson.title);
    console.log('Activity type:', activityRequest.type);
    console.log('Requested count:', activityRequest.count);
    console.log('Prompt version:', prompt.version);
    console.log('Prompt cache key:', prompt.cacheKey);
    console.log('Instructions:', prompt.instructions);
    console.log('Input:', prompt.input);
    console.groupEnd();

    const generatedActivity = await generateLessonActivityPayload(prompt);
    const payload = normalizeGeneratedActivityPayload(generatedActivity.payload, activityRequest);
    const itemCount = getActivityItemCount(activityRequest.type, payload);
    const activity = await createLessonActivity({
      lessonId: lesson.id,
      type: activityRequest.type,
      title: payload.title,
      itemCount,
      payload,
      generationMetadata: generatedActivity.metadata,
      createdBy: user.name,
    });

    console.group('Generated lesson activity');
    console.log('Lesson id:', lesson.id);
    console.log('Activity:', activity);
    console.log('Payload:', payload);
    console.log('Generation metadata:', generatedActivity.metadata);
    console.groupEnd();

    return Response.json({
      activity,
      prompt,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/activities failed:', error);

    return Response.json(
      { error: error.message || 'Failed to generate lesson activity.' },
      { status: 500 }
    );
  }
}
