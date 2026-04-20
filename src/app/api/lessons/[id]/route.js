import { requireApiUser } from '../../../../lib/apiAuth';
import { deleteLessonById, updateLessonContent } from '../../../../lib/lessons';

export const runtime = 'nodejs';

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
