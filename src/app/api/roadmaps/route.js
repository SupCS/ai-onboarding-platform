import { requireApiUser } from '../../../lib/apiAuth';
import { createRoadmap, getAllRoadmaps } from '../../../lib/roadmaps';
import { normalizeLessonTagInput } from '../../../lib/lessonTags';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const roadmaps = await getAllRoadmaps(user);

    return Response.json({ roadmaps });
  } catch (error) {
    console.error('GET /api/roadmaps failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load roadmaps.' },
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
    const title = (body.title || '').trim();
    const description = (body.description || '').trim();
    const lessonIds = Array.isArray(body.lessonIds) ? body.lessonIds : [];
    const tags = normalizeLessonTagInput(body.tags || []);

    if (!title) {
      return Response.json(
        { error: 'Roadmap title is required.' },
        { status: 400 }
      );
    }

    if (lessonIds.length === 0) {
      return Response.json(
        { error: 'Select at least one lesson for the roadmap.' },
        { status: 400 }
      );
    }

    const roadmap = await createRoadmap({
      title,
      description,
      lessonIds,
      tags,
      createdBy: user.name,
      createdByUserId: user.id,
      userId: user.id,
    });

    return Response.json({
      roadmap: {
        ...roadmap,
        viewerCanManage: true,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/roadmaps failed:', error);

    return Response.json(
      { error: error.message || 'Failed to create roadmap.' },
      { status: 500 }
    );
  }
}
