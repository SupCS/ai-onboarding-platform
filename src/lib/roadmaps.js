import crypto from 'crypto';
import { db } from './db.js';
import { ensureLessonsSchema } from './lessons.js';

export async function ensureRoadmapsSchema(client = db) {
  const globalForRoadmaps = globalThis;

  if (client === db && globalForRoadmaps.roadmapsSchemaPromise) {
    return globalForRoadmaps.roadmapsSchemaPromise;
  }

  const schemaPromise = ensureRoadmapsSchemaUncached(client);

  if (client === db) {
    globalForRoadmaps.roadmapsSchemaPromise = schemaPromise.catch((error) => {
      globalForRoadmaps.roadmapsSchemaPromise = null;
      throw error;
    });

    return globalForRoadmaps.roadmapsSchemaPromise;
  }

  return schemaPromise;
}

async function ensureRoadmapsSchemaUncached(client = db) {
  await ensureLessonsSchema(client);

  await client.query(`
    CREATE TABLE IF NOT EXISTS roadmaps (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS roadmap_lessons (
      roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (roadmap_id, lesson_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_roadmaps (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, roadmap_id)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS roadmap_lessons_lesson_id_idx
    ON roadmap_lessons(lesson_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS user_roadmaps_roadmap_id_idx
    ON user_roadmaps(roadmap_id)
  `);
}

function normalizeTitle(value) {
  const title = (value || '').trim();

  return title || 'Untitled roadmap';
}

function mapRoadmap(row, lessons = [], extra = {}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    lessons,
    lessonIds: lessons.map((lesson) => lesson.id),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extra,
  };
}

export async function createRoadmap(input) {
  const lessonIds = [...new Set((input.lessonIds || []).filter(Boolean))];
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await ensureRoadmapsSchema(client);

    if (lessonIds.length === 0) {
      throw new Error('Select at least one lesson for the roadmap.');
    }

    const readyLessonsResult = await client.query(
      `
        SELECT id
        FROM lessons
        WHERE id = ANY($1::text[])
          AND status = 'ready'
      `,
      [lessonIds]
    );
    const readyLessonIds = new Set(readyLessonsResult.rows.map((row) => row.id));

    if (readyLessonIds.size !== lessonIds.length) {
      throw new Error('Roadmaps can include only existing ready lessons.');
    }

    const roadmapId = crypto.randomUUID();
    const roadmapResult = await client.query(
      `
        INSERT INTO roadmaps (id, title, description, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [
        roadmapId,
        normalizeTitle(input.title),
        input.description || '',
        input.createdBy || '',
      ]
    );

    for (let index = 0; index < lessonIds.length; index += 1) {
      await client.query(
        `
          INSERT INTO roadmap_lessons (roadmap_id, lesson_id, sort_order)
          VALUES ($1, $2, $3)
        `,
        [roadmapId, lessonIds[index], index]
      );
    }

    await client.query('COMMIT');

    return getRoadmapById(roadmapResult.rows[0].id, input.userId || null);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getRoadmapLessons(roadmapIds = [], userId = null) {
  if (roadmapIds.length === 0) {
    return new Map();
  }

  const result = await db.query(
    `
      SELECT
        roadmap_lessons.roadmap_id,
        roadmap_lessons.sort_order,
        lessons.id,
        lessons.title,
        lessons.description,
        lessons.status,
        lessons.created_at,
        user_lessons.completed_at
      FROM roadmap_lessons
      JOIN lessons ON lessons.id = roadmap_lessons.lesson_id
      LEFT JOIN user_lessons
        ON user_lessons.lesson_id = lessons.id
        AND user_lessons.user_id = $2
      WHERE roadmap_lessons.roadmap_id = ANY($1::text[])
      ORDER BY roadmap_lessons.sort_order ASC
    `,
    [roadmapIds, userId]
  );

  return result.rows.reduce((groups, row) => {
    const lessons = groups.get(row.roadmap_id) || [];
    lessons.push({
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      isCompleted: Boolean(row.completed_at),
      sortOrder: row.sort_order,
    });
    groups.set(row.roadmap_id, lessons);
    return groups;
  }, new Map());
}

export async function getAllRoadmaps(userId = null) {
  await ensureRoadmapsSchema();

  const roadmapsResult = await db.query(`
    SELECT *
    FROM roadmaps
    ORDER BY created_at DESC
  `);
  const roadmapIds = roadmapsResult.rows.map((roadmap) => roadmap.id);
  const lessonsByRoadmapId = await getRoadmapLessons(roadmapIds, userId);
  const enrollmentRows = userId
    ? await db.query(
        `
          SELECT roadmap_id, enrolled_at
          FROM user_roadmaps
          WHERE user_id = $1
        `,
        [userId]
      )
    : { rows: [] };
  const enrollmentsByRoadmapId = new Map(
    enrollmentRows.rows.map((row) => [row.roadmap_id, row])
  );

  return roadmapsResult.rows.map((roadmap) => {
    const enrollment = enrollmentsByRoadmapId.get(roadmap.id);

    return mapRoadmap(roadmap, lessonsByRoadmapId.get(roadmap.id) || [], {
      isEnrolled: Boolean(enrollment),
      enrolledAt: enrollment?.enrolled_at || null,
    });
  });
}

export async function getRoadmapsForUser(userId) {
  await ensureRoadmapsSchema();

  const roadmapsResult = await db.query(
    `
      SELECT roadmaps.*, user_roadmaps.enrolled_at
      FROM user_roadmaps
      JOIN roadmaps ON roadmaps.id = user_roadmaps.roadmap_id
      WHERE user_roadmaps.user_id = $1
      ORDER BY user_roadmaps.enrolled_at DESC
    `,
    [userId]
  );
  const roadmapIds = roadmapsResult.rows.map((roadmap) => roadmap.id);
  const lessonsByRoadmapId = await getRoadmapLessons(roadmapIds, userId);

  return roadmapsResult.rows.map((roadmap) =>
    mapRoadmap(roadmap, lessonsByRoadmapId.get(roadmap.id) || [], {
      isEnrolled: true,
      enrolledAt: roadmap.enrolled_at,
    })
  );
}

export async function getCompletedRoadmapsForUserLesson(userId, lessonId) {
  await ensureRoadmapsSchema();

  const result = await db.query(
    `
      SELECT
        roadmaps.id,
        roadmaps.title
      FROM roadmaps
      JOIN user_roadmaps
        ON user_roadmaps.roadmap_id = roadmaps.id
        AND user_roadmaps.user_id = $1
      JOIN roadmap_lessons selected_lesson
        ON selected_lesson.roadmap_id = roadmaps.id
        AND selected_lesson.lesson_id = $2
      JOIN roadmap_lessons
        ON roadmap_lessons.roadmap_id = roadmaps.id
      LEFT JOIN user_lessons
        ON user_lessons.lesson_id = roadmap_lessons.lesson_id
        AND user_lessons.user_id = $1
      GROUP BY roadmaps.id, roadmaps.title
      HAVING COUNT(roadmap_lessons.lesson_id) > 0
        AND COUNT(roadmap_lessons.lesson_id) = COUNT(user_lessons.completed_at)
      ORDER BY roadmaps.title ASC
    `,
    [userId, lessonId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
  }));
}

export async function getRoadmapById(roadmapId, userId = null) {
  await ensureRoadmapsSchema();

  const roadmapResult = await db.query(
    `
      SELECT *
      FROM roadmaps
      WHERE id = $1
    `,
    [roadmapId]
  );

  if (roadmapResult.rowCount === 0) {
    return null;
  }

  const lessonsByRoadmapId = await getRoadmapLessons([roadmapId], userId);
  let enrollment = null;

  if (userId) {
    const enrollmentResult = await db.query(
      `
        SELECT enrolled_at
        FROM user_roadmaps
        WHERE user_id = $1
          AND roadmap_id = $2
      `,
      [userId, roadmapId]
    );
    enrollment = enrollmentResult.rows[0] || null;
  }

  return mapRoadmap(
    roadmapResult.rows[0],
    lessonsByRoadmapId.get(roadmapId) || [],
    {
      isEnrolled: Boolean(enrollment),
      enrolledAt: enrollment?.enrolled_at || null,
    }
  );
}

export async function enrollUserInRoadmap(userId, roadmapId) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await ensureRoadmapsSchema(client);

    const result = await client.query(
      `
        INSERT INTO user_roadmaps (user_id, roadmap_id)
        SELECT $1, roadmaps.id
        FROM roadmaps
        WHERE roadmaps.id = $2
        ON CONFLICT (user_id, roadmap_id) DO UPDATE
          SET enrolled_at = user_roadmaps.enrolled_at
        RETURNING enrolled_at
      `,
      [userId, roadmapId]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `
        INSERT INTO user_lessons (user_id, lesson_id, enrolled_at)
        SELECT
          $1,
          roadmap_lessons.lesson_id,
          NOW() - (roadmap_lessons.sort_order * INTERVAL '1 millisecond')
        FROM roadmap_lessons
        JOIN lessons ON lessons.id = roadmap_lessons.lesson_id
        WHERE roadmap_lessons.roadmap_id = $2
          AND lessons.status = 'ready'
        ORDER BY roadmap_lessons.sort_order ASC
        ON CONFLICT (user_id, lesson_id) DO UPDATE
          SET enrolled_at = EXCLUDED.enrolled_at
      `,
      [userId, roadmapId]
    );

    await client.query('COMMIT');

    return {
      roadmapId,
      enrolledAt: result.rows[0]?.enrolled_at || null,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function unenrollUserFromRoadmap(userId, roadmapId) {
  await ensureRoadmapsSchema();

  await db.query(
    `
      DELETE FROM user_roadmaps
      WHERE user_id = $1
        AND roadmap_id = $2
    `,
    [userId, roadmapId]
  );
}
