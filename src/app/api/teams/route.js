import { requireApiUser } from '../../../lib/apiAuth';
import { getTeams, isTeamManager } from '../../../lib/teams';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const teams = await getTeams();

    return Response.json({
      teams,
      permissions: {
        canManageAnyTeam: user.role === 'admin',
        canManageTeams: isTeamManager(user),
        currentUserId: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('GET /api/teams failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load teams.' },
      { status: 500 }
    );
  }
}
