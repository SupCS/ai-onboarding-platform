import { requireApiUser } from '../../../../../../lib/apiAuth';
import {
  getLessonById,
  updateLessonActivity,
} from '../../../../../../lib/lessons';
import { PERMISSIONS, requirePermission } from '../../../../../../lib/permissions';

export const runtime = 'nodejs';

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeQuizPayload(body) {
  const items = Array.isArray(body.items) ? body.items : [];
  const normalizedItems = items
    .map((item) => {
      const question = normalizeString(item.question);
      const options = Array.isArray(item.options)
        ? item.options.map(normalizeString).filter(Boolean).slice(0, 4)
        : [];
      const correctAnswer = normalizeString(item.correctAnswer);
      const explanation = normalizeString(item.explanation);

      if (!question || options.length < 2 || !correctAnswer || !options.includes(correctAnswer)) {
        return null;
      }

      return {
        question,
        options,
        correctAnswer,
        explanation,
      };
    })
    .filter(Boolean);

  if (normalizedItems.length === 0) {
    throw new Error('Add at least one valid quiz question.');
  }

  return {
    type: 'quiz',
    title: normalizeString(body.title) || 'Lesson quiz',
    items: normalizedItems,
  };
}

function normalizeFlashcardsPayload(body) {
  const cards = Array.isArray(body.cards) ? body.cards : [];
  const normalizedCards = cards
    .map((card) => {
      const front = normalizeString(card.front);
      const back = normalizeString(card.back);
      const explanation = normalizeString(card.explanation);

      if (!front || !back) {
        return null;
      }

      return {
        front,
        back,
        explanation,
      };
    })
    .filter(Boolean);

  if (normalizedCards.length === 0) {
    throw new Error('Add at least one valid flashcard.');
  }

  return {
    type: 'flashcards',
    title: normalizeString(body.title) || 'Lesson flashcards',
    cards: normalizedCards,
  };
}

function getItemCount(type, payload) {
  return type === 'flashcards' ? payload.cards.length : payload.items.length;
}

export async function PUT(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LESSONS_MANAGE_ACTIVITIES);

    if (forbidden) {
      return forbidden;
    }

    const { id, activityId } = await params;
    const body = await request.json();

    if (!id || !activityId) {
      return Response.json(
        { error: 'Lesson id and activity id are required.' },
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

    if (user.role !== 'admin' && lesson.createdByUserId !== user.id) {
      return Response.json(
        { error: 'You cannot edit activities for this lesson.' },
        { status: 403 }
      );
    }

    const activity = lesson.activities?.find((item) => item.id === activityId);

    if (!activity) {
      return Response.json(
        { error: 'Activity not found.' },
        { status: 404 }
      );
    }

    const payload = activity.type === 'flashcards'
      ? normalizeFlashcardsPayload(body)
      : normalizeQuizPayload(body);

    const updatedActivity = await updateLessonActivity(id, activityId, {
      title: payload.title,
      itemCount: getItemCount(activity.type, payload),
      payload,
    });
    const updatedLesson = await getLessonById(id);

    return Response.json({
      activity: updatedActivity,
      lesson: updatedLesson,
    });
  } catch (error) {
    console.error('PUT /api/lessons/[id]/activities/[activityId] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update activity.' },
      { status: 500 }
    );
  }
}
