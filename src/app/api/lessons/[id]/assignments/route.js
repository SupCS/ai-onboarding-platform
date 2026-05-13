import { requireApiUser } from '../../../../../lib/apiAuth';
import { enrollUserInLesson } from '../../../../../lib/lessons';
import { getAssignableLearningUsers } from '../../../../../lib/teams';
import { PERMISSIONS, requirePermission } from '../../../../../lib/permissions';

export const runtime = 'nodejs';

function normalizeUserIds(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => String(item || '').trim()).filter(Boolean))];
}

export async function POST(request, { params }) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LEARNING_ASSIGN);

    if (forbidden) {
      return forbidden;
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const userIds = normalizeUserIds(body.userIds);

    if (!id) {
      return Response.json(
        { error: 'Lesson id is required.' },
        { status: 400 }
      );
    }

    if (userIds.length === 0) {
      return Response.json(
        { error: 'Select at least one team member.' },
        { status: 400 }
      );
    }

    const assignableUsers = await getAssignableLearningUsers(user);
    const assignableUserIds = new Set(assignableUsers.map((candidate) => candidate.id));

    if (!userIds.every((userId) => assignableUserIds.has(userId))) {
      return Response.json(
        { error: 'You can assign lessons only to manageable users.' },
        { status: 403 }
      );
    }

    const enrollments = [];

    for (const targetUserId of userIds) {
      const enrollment = await enrollUserInLesson(targetUserId, id);

      if (!enrollment) {
        return Response.json(
          { error: 'Lesson was not found or is not ready yet.' },
          { status: 404 }
        );
      }

      enrollments.push({
        ...enrollment,
        userId: targetUserId,
      });
    }

    return Response.json({
      ok: true,
      enrollments,
    });
  } catch (error) {
    console.error('POST /api/lessons/[id]/assignments failed:', error);

    return Response.json(
      { error: error.message || 'Failed to assign lesson.' },
      { status: 500 }
    );
  }
}
