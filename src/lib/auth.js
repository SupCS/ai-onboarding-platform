import crypto from 'crypto';
import { db } from './db.js';

export const AUTH_COOKIE_NAME = 'ai_onboarding_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const PASSWORD_ITERATIONS = 310000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = 'sha256';

export async function ensureAuthSchema(client = db) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
    ON auth_sessions(user_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
    ON auth_sessions(expires_at)
  `);
}

export function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString('hex');

  return `${PASSWORD_ITERATIONS}:${salt}:${hash}`;
}

export function verifyPassword(password, passwordHash = '') {
  const [iterationsValue, salt, storedHash] = passwordHash.split(':');
  const iterations = Number(iterationsValue);

  if (!iterations || !salt || !storedHash) {
    return false;
  }

  const candidateHash = crypto
    .pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString('hex');

  const storedBuffer = Buffer.from(storedHash, 'hex');
  const candidateBuffer = Buffer.from(candidateHash, 'hex');

  if (storedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
}

export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createUser({ name, email, password }) {
  await ensureAuthSchema();

  const normalizedEmail = normalizeEmail(email);
  const result = await db.query(
    `
      INSERT INTO users (id, name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `,
    [crypto.randomUUID(), name.trim(), normalizedEmail, hashPassword(password)]
  );

  return mapUser(result.rows[0]);
}

export async function authenticateUser({ email, password }) {
  await ensureAuthSchema();

  const normalizedEmail = normalizeEmail(email);
  const result = await db.query(
    `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE email = $1
    `,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  return mapUser(user);
}

export async function createSession(userId) {
  await ensureAuthSchema();

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.query(
    `
      INSERT INTO auth_sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
    `,
    [crypto.randomUUID(), userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt,
  };
}

export async function getUserBySessionToken(token) {
  if (!token) {
    return null;
  }

  await ensureAuthSchema();

  const result = await db.query(
    `
      SELECT users.id, users.name, users.email, users.role, users.created_at, users.updated_at
      FROM auth_sessions
      JOIN users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
        AND auth_sessions.expires_at > NOW()
      LIMIT 1
    `,
    [hashSessionToken(token)]
  );

  return mapUser(result.rows[0]);
}

export async function deleteSessionByToken(token) {
  if (!token) {
    return;
  }

  await ensureAuthSchema();

  await db.query(
    `
      DELETE FROM auth_sessions
      WHERE token_hash = $1
    `,
    [hashSessionToken(token)]
  );
}
