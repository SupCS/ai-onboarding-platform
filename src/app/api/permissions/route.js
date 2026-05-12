import { requireApiUser } from '../../../lib/apiAuth';
import { USER_ROLES } from '../../../lib/auth';
import {
  PERMISSIONS,
  PERMISSION_DEFINITIONS,
  getPermissionSnapshotForUsers,
  isTeamLeadForMember,
  setUserPermissionOverrides,
  userHasPermission,
} from '../../../lib/permissions';
import { getAllUsers, getUserById } from '../../../lib/teams';

export const runtime = 'nodejs';

const ADMIN_TO_TEAMLEAD_DENYLIST = new Set([
  PERMISSIONS.ADMIN_MANAGE_ROLES,
  PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS,
]);

const TEAMLEAD_TO_MEMBER_DENYLIST = new Set([
  PERMISSIONS.ADMIN_MANAGE_ROLES,
  PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS,
  PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS,
  PERMISSIONS.TEAMS_MANAGE_MEMBERS,
]);

function filterOverrides(overrides = {}, denylist = new Set()) {
  const allowedKeys = new Set(PERMISSION_DEFINITIONS.map((permission) => permission.key));

  return Object.fromEntries(
    Object.entries(overrides).filter(([key]) => allowedKeys.has(key) && !denylist.has(key))
  );
}

export async function GET() {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const canManageTeamLeadPermissions = await userHasPermission(
      user,
      PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS
    );
    const canManageTeamMemberPermissions = await userHasPermission(
      user,
      PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS
    );

    if (!canManageTeamLeadPermissions && !canManageTeamMemberPermissions) {
      return Response.json(
        { error: 'You cannot manage permissions.' },
        { status: 403 }
      );
    }

    const users = await getAllUsers();
    const snapshot = await getPermissionSnapshotForUsers(users);

    return Response.json({
      permissionDefinitions: PERMISSION_DEFINITIONS,
      permissionsByUserId: snapshot,
    });
  } catch (error) {
    console.error('GET /api/permissions failed:', error);

    return Response.json(
      { error: error.message || 'Failed to load permissions.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const body = await request.json();
    const targetUserId = String(body.userId || '').trim();
    const targetUser = targetUserId ? await getUserById(targetUserId) : null;

    if (!targetUser) {
      return Response.json(
        { error: 'Target user not found.' },
        { status: 404 }
      );
    }

    let overrides = {};

    if (user.role === USER_ROLES.ADMIN) {
      const canManageTeamLeadPermissions = await userHasPermission(
        user,
        PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS
      );

      if (!canManageTeamLeadPermissions || targetUser.role === USER_ROLES.ADMIN) {
        return Response.json(
          { error: 'You cannot manage permissions for this user.' },
          { status: 403 }
        );
      }

      overrides = filterOverrides(body.overrides || {}, ADMIN_TO_TEAMLEAD_DENYLIST);
    } else if (user.role === USER_ROLES.TEAMLEAD) {
      const canManageTeamMemberPermissions = await userHasPermission(
        user,
        PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS
      );
      const isOwnMember = await isTeamLeadForMember(user.id, targetUser.id);

      if (!canManageTeamMemberPermissions || !isOwnMember || targetUser.role !== USER_ROLES.MEMBER) {
        return Response.json(
          { error: 'You cannot manage permissions for this user.' },
          { status: 403 }
        );
      }

      overrides = filterOverrides(body.overrides || {}, TEAMLEAD_TO_MEMBER_DENYLIST);
    } else {
      return Response.json(
        { error: 'You cannot manage permissions.' },
        { status: 403 }
      );
    }

    await setUserPermissionOverrides(targetUser.id, overrides, user.id);
    const snapshot = await getPermissionSnapshotForUsers([targetUser]);

    return Response.json({
      permissions: snapshot[targetUser.id],
    });
  } catch (error) {
    console.error('PUT /api/permissions failed:', error);

    return Response.json(
      { error: error.message || 'Failed to update permissions.' },
      { status: 500 }
    );
  }
}
