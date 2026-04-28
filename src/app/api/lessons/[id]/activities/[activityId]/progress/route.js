import { requireApiUser } from '../../../../../../../lib/apiAuth';
import {
  completeFlashcardsActivityForUser,
  getLessonEnrollmentForUser,
  resetLessonActivityProgressForUser,
} from '../../../../../../../lib/lessons';
import { getCompletedRoadmapsForUserLesson } from '../../../../../../../lib/roadmaps';

export const runtime = 'nodejs';

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id, activityId } = await params;
    const body = await request.json().catch(() => ({}));

    if (!id || !activityId) {
      return Response.json(
        { error: 'Lesson id and activity id are required.' },
        { status: 400 }
      );
    }

    if (body.type !== 'flashcards') {
      return Response.json(
        { error: 'Only flashcard activity completion is supported for now.' },
        { status: 400 }
      );
    }

    const enrollment = await getLessonEnrollmentForUser(user.id, id);

    if (!enrollment) {
      return Response.json(
        { error: 'Lesson is not in My Lessons.' },
        { status: 404 }
      );
    }

    const result = await completeFlashcardsActivityForUser(user.id, id, activityId, {
      reviewedCards: Number.parseInt(body.reviewedCards, 10) || 0,
      completedFrom: 'flashcards-player',
    });

    if (!result) {
      return Response.json(
        { error: 'Activity not found.' },
        { status: 404 }
      );
    }

    const completedRoadmaps = result.lessonCompleted
      ? await getCompletedRoadmapsForUserLesson(user.id, id)
      : [];

    return Response.json({
      ok: true,
      progress: result.progress,
      activities: result.activities,
      enrollment: result.enrollment,
      lessonCompleted: result.lessonCompleted,
      completedRoadmaps,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/activities/[activityId]/progress failed:', error);

    return Response.json(
      { error: error.message || 'Failed to save activity progress.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id, activityId } = await params;

    if (!id || !activityId) {
      return Response.json(
        { error: 'Lesson id and activity id are required.' },
        { status: 400 }
      );
    }

    const enrollment = await getLessonEnrollmentForUser(user.id, id);

    if (!enrollment) {
      return Response.json(
        { error: 'Lesson is not in My Lessons.' },
        { status: 404 }
      );
    }

    const result = await resetLessonActivityProgressForUser(user.id, id, activityId);

    if (!result) {
      return Response.json(
        { error: 'Activity not found.' },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      progress: result.progress,
      enrollment: result.enrollment,
    });
  } catch (error) {
    console.error('DELETE /api/lessons/[id]/activities/[activityId]/progress failed:', error);

    return Response.json(
      { error: error.message || 'Failed to reset activity progress.' },
      { status: 500 }
    );
  }
}
