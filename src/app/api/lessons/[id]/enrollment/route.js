import { requireApiUser } from '../../../../../lib/apiAuth';
import {
  enrollUserInLesson,
  unenrollUserFromLesson,
} from '../../../../../lib/lessons';

export const runtime = 'nodejs';

export async function POST(_request, { params }) {
  try {
    const { user, response } = await requireApiUser();

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

    const enrollment = await enrollUserInLesson(user.id, id);

    if (!enrollment) {
      return Response.json(
        { error: 'Lesson was not found or is not ready yet.' },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      enrollment,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/enrollment failed:', error);

    return Response.json(
      { error: error.message || 'Failed to add lesson to My Lessons.' },
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

    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    await unenrollUserFromLesson(user.id, id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/lessons/[id]/enrollment failed:', error);

    return Response.json(
      { error: error.message || 'Failed to remove lesson from My Lessons.' },
      { status: 500 }
    );
  }
}
