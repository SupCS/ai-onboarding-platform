import { db } from './db.js';
import { ensureAuthSchema, USER_ROLES } from './auth.js';
import { ensureTeamsSchema } from './teams.js';

const globalForPermissions = globalThis;

export const PERMISSIONS = {
  ADMIN_MANAGE_ROLES: 'admin.manage_roles',
  PERMISSIONS_MANAGE_TEAMLEADS: 'permissions.manage_teamleads',
  PERMISSIONS_MANAGE_TEAM_MEMBERS: 'permissions.manage_team_members',
  TEAMS_MANAGE_MEMBERS: 'teams.manage_members',
  MATERIALS_CREATE: 'materials.create',
  MATERIALS_EDIT: 'materials.edit',
  MATERIALS_DELETE: 'materials.delete',
  LESSONS_CREATE: 'lessons.create',
  LESSONS_MANAGE: 'lessons.manage',
  LESSONS_PUBLISH_ARCHIVE: 'lessons.publish_archive',
  LESSONS_MANAGE_ACTIVITIES: 'lessons.manage_activities',
  LESSONS_MANAGE_ASSETS: 'lessons.manage_assets',
  ROADMAPS_CREATE: 'roadmaps.create',
  ROADMAPS_MANAGE: 'roadmaps.manage',
  LEARNING_ENROLL: 'learning.enroll',
  LEARNING_COMPLETE: 'learning.complete',
  LEARNING_ASK: 'learning.ask',
};

export const PERMISSION_GROUPS = [
  {
    title: 'Admin',
    permissions: [
      {
        key: PERMISSIONS.ADMIN_MANAGE_ROLES,
        label: 'Manage roles',
        description: 'Assign and remove team lead roles.',
      },
      {
        key: PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS,
        label: 'Manage team lead permissions',
        description: 'Change permission overrides for team leads.',
      },
      {
        key: PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS,
        label: 'Manage team member permissions',
        description: 'Change permission overrides for members of an owned team.',
      },
    ],
  },
  {
    title: 'Teams',
    permissions: [
      {
        key: PERMISSIONS.TEAMS_MANAGE_MEMBERS,
        label: 'Manage team members',
        description: 'Add and remove members in manageable teams.',
      },
    ],
  },
  {
    title: 'Materials',
    permissions: [
      { key: PERMISSIONS.MATERIALS_CREATE, label: 'Create materials' },
      { key: PERMISSIONS.MATERIALS_EDIT, label: 'Edit materials' },
      { key: PERMISSIONS.MATERIALS_DELETE, label: 'Delete materials' },
    ],
  },
  {
    title: 'Lessons',
    permissions: [
      { key: PERMISSIONS.LESSONS_CREATE, label: 'Create lessons' },
      { key: PERMISSIONS.LESSONS_MANAGE, label: 'Edit/delete lessons' },
      { key: PERMISSIONS.LESSONS_PUBLISH_ARCHIVE, label: 'Publish/archive lessons' },
      { key: PERMISSIONS.LESSONS_MANAGE_ACTIVITIES, label: 'Manage activities' },
      { key: PERMISSIONS.LESSONS_MANAGE_ASSETS, label: 'Manage lesson assets' },
    ],
  },
  {
    title: 'Roadmaps',
    permissions: [
      { key: PERMISSIONS.ROADMAPS_CREATE, label: 'Create roadmaps' },
      { key: PERMISSIONS.ROADMAPS_MANAGE, label: 'Edit/delete roadmaps' },
    ],
  },
  {
    title: 'Learning',
    permissions: [
      { key: PERMISSIONS.LEARNING_ENROLL, label: 'Enroll in lessons/roadmaps' },
      { key: PERMISSIONS.LEARNING_COMPLETE, label: 'Complete lessons/activities' },
      { key: PERMISSIONS.LEARNING_ASK, label: 'Ask lesson assistant' },
    ],
  },
];

export const PERMISSION_DEFINITIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map((permission) => ({
    ...permission,
    group: group.title,
  }))
);

export const PERMISSION_KEYS = PERMISSION_DEFINITIONS.map((permission) => permission.key);

const DEFAULT_ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, true])),
  [USER_ROLES.TEAMLEAD]: {
    [PERMISSIONS.ADMIN_MANAGE_ROLES]: false,
    [PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS]: false,
    [PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS]: true,
    [PERMISSIONS.TEAMS_MANAGE_MEMBERS]: true,
    [PERMISSIONS.MATERIALS_CREATE]: true,
    [PERMISSIONS.MATERIALS_EDIT]: true,
    [PERMISSIONS.MATERIALS_DELETE]: true,
    [PERMISSIONS.LESSONS_CREATE]: true,
    [PERMISSIONS.LESSONS_MANAGE]: true,
    [PERMISSIONS.LESSONS_PUBLISH_ARCHIVE]: true,
    [PERMISSIONS.LESSONS_MANAGE_ACTIVITIES]: true,
    [PERMISSIONS.LESSONS_MANAGE_ASSETS]: true,
    [PERMISSIONS.ROADMAPS_CREATE]: true,
    [PERMISSIONS.ROADMAPS_MANAGE]: true,
    [PERMISSIONS.LEARNING_ENROLL]: true,
    [PERMISSIONS.LEARNING_COMPLETE]: true,
    [PERMISSIONS.LEARNING_ASK]: true,
  },
  [USER_ROLES.MEMBER]: {
    [PERMISSIONS.ADMIN_MANAGE_ROLES]: false,
    [PERMISSIONS.PERMISSIONS_MANAGE_TEAMLEADS]: false,
    [PERMISSIONS.PERMISSIONS_MANAGE_TEAM_MEMBERS]: false,
    [PERMISSIONS.TEAMS_MANAGE_MEMBERS]: false,
    [PERMISSIONS.MATERIALS_CREATE]: false,
    [PERMISSIONS.MATERIALS_EDIT]: false,
    [PERMISSIONS.MATERIALS_DELETE]: false,
    [PERMISSIONS.LESSONS_CREATE]: false,
    [PERMISSIONS.LESSONS_MANAGE]: false,
    [PERMISSIONS.LESSONS_PUBLISH_ARCHIVE]: false,
    [PERMISSIONS.LESSONS_MANAGE_ACTIVITIES]: false,
    [PERMISSIONS.LESSONS_MANAGE_ASSETS]: false,
    [PERMISSIONS.ROADMAPS_CREATE]: false,
    [PERMISSIONS.ROADMAPS_MANAGE]: false,
    [PERMISSIONS.LEARNING_ENROLL]: true,
    [PERMISSIONS.LEARNING_COMPLETE]: true,
    [PERMISSIONS.LEARNING_ASK]: true,
  },
};

export async function ensurePermissionsSchema(client = db) {
  if (client === db && globalForPermissions.permissionsSchemaPromise) {
    return globalForPermissions.permissionsSchemaPromise;
  }

  const schemaPromise = ensurePermissionsSchemaUncached(client);

  if (client === db) {
    globalForPermissions.permissionsSchemaPromise = schemaPromise.catch((error) => {
      globalForPermissions.permissionsSchemaPromise = null;
      throw error;
    });

    return globalForPermissions.permissionsSchemaPromise;
  }

  return schemaPromise;
}

async function ensurePermissionsSchemaUncached(client = db) {
  await ensureAuthSchema(client);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_permission_overrides (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permission_key TEXT NOT NULL,
      is_allowed BOOLEAN NOT NULL,
      granted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, permission_key)
    )
  `);
}

function getRoleDefaults(role = USER_ROLES.MEMBER) {
  const defaults = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS[USER_ROLES.MEMBER];

  return Object.fromEntries(PERMISSION_KEYS.map((key) => [key, Boolean(defaults[key])]));
}

export async function getUserPermissionMap(user) {
  if (!user) {
    return getRoleDefaults(USER_ROLES.MEMBER);
  }

  await ensurePermissionsSchema();

  const permissionMap = getRoleDefaults(user.role);
  const result = await db.query(
    `
      SELECT permission_key, is_allowed
      FROM user_permission_overrides
      WHERE user_id = $1
    `,
    [user.id]
  );

  for (const row of result.rows) {
    if (PERMISSION_KEYS.includes(row.permission_key)) {
      permissionMap[row.permission_key] = Boolean(row.is_allowed);
    }
  }

  return permissionMap;
}

export async function userHasPermission(user, permissionKey) {
  if (!user || !PERMISSION_KEYS.includes(permissionKey)) {
    return false;
  }

  const permissions = await getUserPermissionMap(user);
  return Boolean(permissions[permissionKey]);
}

export async function requirePermission(user, permissionKey) {
  if (await userHasPermission(user, permissionKey)) {
    return null;
  }

  return Response.json(
    { error: 'You do not have permission to perform this action.' },
    { status: 403 }
  );
}

export async function getPermissionSnapshotForUsers(users = []) {
  await ensurePermissionsSchema();

  const ids = users.map((user) => user.id).filter(Boolean);
  const overridesResult = ids.length
    ? await db.query(
        `
          SELECT user_id, permission_key, is_allowed
          FROM user_permission_overrides
          WHERE user_id = ANY($1::uuid[])
        `,
        [ids]
      )
    : { rows: [] };
  const overridesByUserId = new Map();

  for (const row of overridesResult.rows) {
    const rows = overridesByUserId.get(row.user_id) || [];
    rows.push(row);
    overridesByUserId.set(row.user_id, rows);
  }

  return Object.fromEntries(
    users.map((user) => {
      const effective = getRoleDefaults(user.role);
      const overrides = {};

      for (const row of overridesByUserId.get(user.id) || []) {
        if (PERMISSION_KEYS.includes(row.permission_key)) {
          effective[row.permission_key] = Boolean(row.is_allowed);
          overrides[row.permission_key] = Boolean(row.is_allowed);
        }
      }

      return [
        user.id,
        {
          role: user.role,
          effective,
          overrides,
        },
      ];
    })
  );
}

export async function setUserPermissionOverrides(targetUserId, overrides = {}, grantedByUserId = null) {
  await ensurePermissionsSchema();

  const userResult = await db.query(
    `
      SELECT role
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [targetUserId]
  );
  const roleDefaults = getRoleDefaults(userResult.rows[0]?.role);
  const entries = Object.entries(overrides)
    .filter(([key, value]) => PERMISSION_KEYS.includes(key) && Boolean(value) !== roleDefaults[key])
    .map(([key, value]) => [key, Boolean(value)]);
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await client.query(
      `
        DELETE FROM user_permission_overrides
        WHERE user_id = $1
      `,
      [targetUserId]
    );

    for (const [permissionKey, isAllowed] of entries) {
      await client.query(
        `
          INSERT INTO user_permission_overrides (
            user_id,
            permission_key,
            is_allowed,
            granted_by_user_id,
            updated_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (user_id, permission_key)
          DO UPDATE SET
            is_allowed = EXCLUDED.is_allowed,
            granted_by_user_id = EXCLUDED.granted_by_user_id,
            updated_at = NOW()
        `,
        [targetUserId, permissionKey, isAllowed, grantedByUserId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function isTeamLeadForMember(leadUserId, memberUserId) {
  await ensureTeamsSchema();

  const result = await db.query(
    `
      SELECT 1
      FROM team_members
      WHERE lead_user_id = $1
        AND member_user_id = $2
      LIMIT 1
    `,
    [leadUserId, memberUserId]
  );

  return result.rowCount > 0;
}
