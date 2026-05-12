import { requireApiUser } from '../../../lib/apiAuth';
import { getAllUsers, getTeams } from '../../../lib/teams';
import {
  PERMISSION_DEFINITIONS,
  PERMISSIONS,
  getPermissionSnapshotForUsers,
  getUserPermissionMap,
} from '../../../lib/permissions';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const teams = await getTeams();
    const users = await getAllUsers();
    const currentUserPermissions = await getUserPermissionMap(user);
    const permissionsByUserId = await getPermissionSnapshotForUsers(users);

    return Response.json({
      teams,
      users,
      permissionDefinitions: PERMISSION_DEFINITIONS,
      permissionsByUserId,
      permissions: {
        canManageAnyTeam:
          user.role === 'admin' &&
          currentUserPermissions[PERMISSIONS.TEAMS_MANAGE_MEMBERS],
        canManageTeams: Boolean(currentUserPermissions[PERMISSIONS.TEAMS_MANAGE_MEMBERS]),
        canManageTeamMemberPermissions: Boolean(
          currentUserPermissions[PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS]
        ),
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
