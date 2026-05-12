import { requireApiUser } from '../../../../lib/apiAuth';
import { normalizeLessonTagInput } from '../../../../lib/lessonTags';
import {
  canManageRoadmap,
  deleteRoadmapById,
  getRoadmapById,
  updateRoadmap,
} from '../../../../lib/roadmaps';

export const runtime = 'nodejs';

function normalizeRoadmapPayload(body = {}) {
  return {
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    lessonIds: Array.isArray(body.lessonIds) ? body.lessonIds : [],
    tags: normalizeLessonTagInput(body.tags || []),
  };
}

export async function PUT(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const { id } = await params;
    const payload = normalizeRoadmapPayload(await request.json());

    if (!id) {
      return Response.json(
        { error: 'Roadmap id is required.' },
        { status: 400 }
      );
    }

    if (!payload.title) {
      return Response.json(
        { error: 'Roadmap title is required.' },
        { status: 400 }
      );
    }

    if (payload.lessonIds.length === 0) {
      return Response.json(
        { error: 'Select at least one lesson for the roadmap.' },
        { status: 400 }
      );
    }

    const existingRoadmap = await getRoadmapById(id, user.id);

    if (!existingRoadmap) {
      return Response.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    if (!(await canManageRoadmap(user, existingRoadmap))) {
      return Response.json(
        { error: 'You cannot edit this roadmap.' },
        { status: 403 }
      );
    }

    const roadmap = await updateRoadmap(id, {
      ...payload,
      userId: user.id,
    });

    if (!roadmap) {
      return Response.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    return Response.json({
      roadmap: {
        ...roadmap,
        viewerCanManage: true,
      },
    });
  } catch (error) {
    console.error('PUT /api/roadmaps/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update roadmap.' },
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

    const existingRoadmap = await getRoadmapById(id, user.id);

    if (!existingRoadmap) {
      return Response.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    if (!(await canManageRoadmap(user, existingRoadmap))) {
      return Response.json(
        { error: 'You cannot delete this roadmap.' },
        { status: 403 }
      );
    }

    const deletedRoadmap = await deleteRoadmapById(id);

    if (!deletedRoadmap) {
      return Response.json(
        { error: 'Roadmap not found.' },
        { status: 404 }
      );
    }

    return Response.json({ ok: true, id });
  } catch (error) {
    console.error('DELETE /api/roadmaps/[id] failed:', error);

    return Response.json(
      { error: error.message || 'Failed to delete roadmap.' },
      { status: 500 }
    );
  }
}
