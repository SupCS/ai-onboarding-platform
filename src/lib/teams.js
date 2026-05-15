import { db } from './db.js';
import { ensureAuthSchema, normalizeEmail, USER_ROLES } from './auth.js';

const globalForTeams = globalThis;

export async function ensureTeamsSchema(client = db) {
  if (client === db && globalForTeams.teamsSchemaPromise) {
    return globalForTeams.teamsSchemaPromise;
  }

  const schemaPromise = ensureTeamsSchemaUncached(client);

  if (client === db) {
    globalForTeams.teamsSchemaPromise = schemaPromise.catch((error) => {
      globalForTeams.teamsSchemaPromise = null;
      throw error;
    });

    return globalForTeams.teamsSchemaPromise;
  }

  return schemaPromise;
}

async function ensureTeamsSchemaUncached(client = db) {
  await ensureAuthSchema(client);

  await client.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      lead_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      member_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lead_user_id, member_user_id),
      CONSTRAINT team_members_no_self_member
        CHECK (lead_user_id <> member_user_id)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS team_members_member_user_id_idx
    ON team_members(member_user_id)
  `);
}

function mapUser(row, prefix = '') {
  if (!row) {
    return null;
  }

  return {
    id: row[`${prefix}id`],
    name: row[`${prefix}name`],
    email: row[`${prefix}email`],
    role: row[`${prefix}role`],
    position: row[`${prefix}position`] || '',
    avatarStorageKey: row[`${prefix}avatar_storage_key`] || '',
    avatarColor: row[`${prefix}avatar_color`] || '',
  };
}

function mapTeamRows(rows = []) {
  const teamsByLeadId = new Map();

  for (const row of rows) {
    const leadId = row.lead_id;

    if (!teamsByLeadId.has(leadId)) {
      teamsByLeadId.set(leadId, {
        lead: mapUser(row, 'lead_'),
        members: [],
      });
    }

    if (row.member_id) {
      teamsByLeadId.get(leadId).members.push(mapUser(row, 'member_'));
    }
  }

  return [...teamsByLeadId.values()];
}

export function canManageTeam(user, leadUserId) {
  if (!user) {
    return false;
  }

  return user.role === USER_ROLES.ADMIN || user.id === leadUserId;
}

export function isTeamManager(user) {
  return user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.TEAMLEAD;
}

export function isAdmin(user) {
  return user?.role === USER_ROLES.ADMIN;
}

export async function getAllUsers() {
  await ensureTeamsSchema();

  const result = await db.query(`
    SELECT id, name, email, role, position, avatar_storage_key, avatar_color
    FROM users
    ORDER BY
      CASE role
        WHEN 'admin' THEN 1
        WHEN 'teamlead' THEN 2
        ELSE 3
      END,
      name ASC,
      email ASC
  `);

  return result.rows.map((row) => mapUser(row));
}

export async function getTeams() {
  await ensureTeamsSchema();

  const result = await db.query(`
    SELECT
      leads.id AS lead_id,
      leads.name AS lead_name,
      leads.email AS lead_email,
      leads.role AS lead_role,
      leads.position AS lead_position,
      leads.avatar_storage_key AS lead_avatar_storage_key,
      leads.avatar_color AS lead_avatar_color,
      members.id AS member_id,
      members.name AS member_name,
      members.email AS member_email,
      members.role AS member_role,
      members.position AS member_position,
      members.avatar_storage_key AS member_avatar_storage_key,
      members.avatar_color AS member_avatar_color
    FROM users leads
    LEFT JOIN team_members
      ON team_members.lead_user_id = leads.id
    LEFT JOIN users members
      ON members.id = team_members.member_user_id
    WHERE leads.role IN ('teamlead', 'admin')
    ORDER BY leads.name ASC, leads.email ASC, members.name ASC, members.email ASC
  `);

  return mapTeamRows(result.rows);
}

export async function getAssignableLearningUsers(user) {
  if (!user) {
    return [];
  }

  if (user.role === USER_ROLES.ADMIN) {
    const users = await getAllUsers();
    return users.filter((candidate) => candidate.id !== user.id);
  }

  if (user.role !== USER_ROLES.TEAMLEAD) {
    return [];
  }

  const teams = await getTeams();
  const team = teams.find((item) => item.lead?.id === user.id);

  return team?.members || [];
}

export async function getUserByEmail(email) {
  await ensureTeamsSchema();

  const result = await db.query(
    `
      SELECT id, name, email, role, position, avatar_storage_key, avatar_color
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [normalizeEmail(email)]
  );

  return mapUser(result.rows[0]);
}

export async function getUserByEmailOrName(value) {
  await ensureTeamsSchema();

  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return null;
  }

  const result = await db.query(
    `
      SELECT id, name, email, role, position, avatar_storage_key, avatar_color
      FROM users
      WHERE email = $1
        OR LOWER(name) = LOWER($2)
      ORDER BY
        CASE WHEN email = $1 THEN 0 ELSE 1 END,
        name ASC,
        email ASC
      LIMIT 1
    `,
    [normalizeEmail(normalizedValue), normalizedValue]
  );

  return mapUser(result.rows[0]);
}

export async function getUserById(userId) {
  await ensureTeamsSchema();

  const result = await db.query(
    `
      SELECT id, name, email, role, position, avatar_storage_key, avatar_color
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  return mapUser(result.rows[0]);
}

export async function setTeamLeadByEmail(email) {
  await ensureTeamsSchema();

  const result = await db.query(
    `
      UPDATE users
      SET role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'teamlead' END,
          updated_at = NOW()
      WHERE email = $1
      RETURNING id, name, email, role, position, avatar_storage_key, avatar_color
    `,
    [normalizeEmail(email)]
  );

  return mapUser(result.rows[0]);
}

export async function removeTeamLeadByEmail(email) {
  await ensureTeamsSchema();

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
        UPDATE users
        SET role = 'member',
            updated_at = NOW()
        WHERE email = $1
          AND role = 'teamlead'
        RETURNING id, name, email, role, position, avatar_storage_key, avatar_color
      `,
      [normalizeEmail(email)]
    );

    const user = mapUser(result.rows[0]);

    if (user) {
      await client.query(
        `
          DELETE FROM team_members
          WHERE lead_user_id = $1
        `,
        [user.id]
      );
    }

    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function addTeamMemberByEmail(leadUserId, email) {
  await ensureTeamsSchema();

  const member = await getUserByEmail(email);

  return addTeamMember(leadUserId, member);
}

export async function addTeamMemberByUserId(leadUserId, memberUserId) {
  await ensureTeamsSchema();

  const member = await getUserById(memberUserId);

  return addTeamMember(leadUserId, member);
}

export async function addTeamMemberByEmailOrName(leadUserId, value) {
  await ensureTeamsSchema();

  const member = await getUserByEmailOrName(value);

  return addTeamMember(leadUserId, member);
}

async function addTeamMember(leadUserId, member) {
  if (!member) {
    return null;
  }

  if (member.id === leadUserId) {
    throw new Error('A team lead cannot be added to their own team.');
  }

  await db.query(
    `
      INSERT INTO team_members (lead_user_id, member_user_id)
      VALUES ($1, $2)
      ON CONFLICT (lead_user_id, member_user_id)
      DO UPDATE SET added_at = team_members.added_at
    `,
    [leadUserId, member.id]
  );

  return member;
}

export async function removeTeamMember(leadUserId, memberUserId) {
  await ensureTeamsSchema();

  const result = await db.query(
    `
      DELETE FROM team_members
      WHERE lead_user_id = $1
        AND member_user_id = $2
      RETURNING member_user_id
    `,
    [leadUserId, memberUserId]
  );

  return result.rowCount > 0;
}
