import { requireApiUser } from '../../../../lib/apiAuth';
import { getAssignableLearningUsers } from '../../../../lib/teams';
import { PERMISSIONS, requirePermission } from '../../../../lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LEARNING_ASSIGN);

    if (forbidden) {
      return forbidden;
    }

    return Response.json({
      users: await getAssignableLearningUsers(user),
    });
  } catch (error) {
    console.error('GET /api/learning/assignees failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load assignable users.' },
      { status: 500 }
    );
  }
}
