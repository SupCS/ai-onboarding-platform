import { requireApiUser } from '../../../../../lib/apiAuth';
import {
  enrollUserInRoadmap,
  unenrollUserFromRoadmap,
} from '../../../../../lib/roadmaps';

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
        { error: 'Roadmap id is required.' },
        { status: 400 }
      );
    }

    const enrollment = await enrollUserInRoadmap(user.id, id);

    if (!enrollment) {
      return Response.json(
        { error: 'Roadmap was not found.' },
        { status: 404 }
      );
    }

    return Response.json({
      ok: true,
      enrollment,
    });
  } catch (error) {
    console.error('POST /api/roadmaps/[id]/enrollment failed:', error);

    return Response.json(
      { error: error.message || 'Failed to subscribe to roadmap.' },
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
        { error: 'Roadmap id is required.' },
        { status: 400 }
      );
    }

    await unenrollUserFromRoadmap(user.id, id);

    return Response.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/roadmaps/[id]/enrollment failed:', error);

    return Response.json(
      { error: error.message || 'Failed to unsubscribe from roadmap.' },
      { status: 500 }
    );
  }
}
