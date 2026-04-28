import crypto from 'crypto';
import { db } from './db.js';
import { ensureAuthSchema } from './auth.js';
import { LESSON_MVP_LIMITS } from './lessonConstants.js';
export {
  LESSON_CONTENT_FORMAT,
  LESSON_MVP_LIMITS,
  LESSON_STATUSES,
} from './lessonConstants.js';

const LESSONS_SCHEMA_VERSION = 2;

export async function ensureLessonsSchema(client = db) {
  const globalForLessons = globalThis;

  if (
    client === db &&
    globalForLessons.lessonsSchemaPromise &&
    globalForLessons.lessonsSchemaVersion === LESSONS_SCHEMA_VERSION
  ) {
    return globalForLessons.lessonsSchemaPromise;
  }

  const schemaPromise = ensureLessonsSchemaUncached(client);

  if (client === db) {
    globalForLessons.lessonsSchemaVersion = LESSONS_SCHEMA_VERSION;
    globalForLessons.lessonsSchemaPromise = schemaPromise.catch((error) => {
      globalForLessons.lessonsSchemaPromise = null;
      globalForLessons.lessonsSchemaVersion = null;
      throw error;
    });

    return globalForLessons.lessonsSchemaPromise;
  }

  return schemaPromise;
}

async function ensureLessonsSchemaUncached(client = db) {
  await ensureAuthSchema(client);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      user_instructions TEXT NOT NULL DEFAULT '',
      depth TEXT NOT NULL DEFAULT 'standard',
      tone TEXT NOT NULL DEFAULT 'clear',
      desired_format TEXT NOT NULL DEFAULT 'structured theoretical lesson',
      content_format TEXT NOT NULL DEFAULT 'markdown',
      content_markdown TEXT NOT NULL DEFAULT '',
      content_html TEXT NOT NULL DEFAULT '',
      generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      error_message TEXT NOT NULL DEFAULT '',
      created_by TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT lessons_status_check
        CHECK (status IN ('draft', 'generating', 'ready', 'failed')),
      CONSTRAINT lessons_content_format_check
        CHECK (content_format IN ('markdown'))
    )
  `);

  await client.query(`
    ALTER TABLE lessons
    ADD COLUMN IF NOT EXISTS content_html TEXT NOT NULL DEFAULT ''
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lesson_materials (
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lesson_id, material_id)
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_lessons (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      PRIMARY KEY (user_id, lesson_id)
    )
  `);

  await client.query(`
    ALTER TABLE user_lessons
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS user_lessons_lesson_id_idx
    ON user_lessons(lesson_id)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lesson_activities (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      item_count INTEGER NOT NULL DEFAULT 0,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      generation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_by TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT lesson_activities_type_check
        CHECK (type IN ('quiz', 'flashcards'))
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS lesson_activities_lesson_id_idx
    ON lesson_activities(lesson_id, created_at DESC)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_lesson_activity_progress (
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id TEXT NOT NULL REFERENCES lesson_activities(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'not_started',
      score NUMERIC,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, activity_id),
      CONSTRAINT user_lesson_activity_progress_status_check
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'failed'))
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS user_lesson_activity_progress_lesson_idx
    ON user_lesson_activity_progress(user_id, lesson_id)
  `);
}

function mapLesson(row, materialIds = [], extra = {}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    materialIds,
    userInstructions: row.user_instructions,
    depth: row.depth,
    tone: row.tone,
    desiredFormat: row.desired_format,
    contentFormat: row.content_format,
    contentMarkdown: row.content_markdown,
    contentHtml: row.content_html || '',
    generationMetadata: row.generation_metadata,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extra,
  };
}

function mapLessonActivity(row) {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    title: row.title,
    itemCount: row.item_count,
    payload: row.payload,
    generationMetadata: row.generation_metadata,
    createdBy: row.created_by,
    createdAt: row.created_at,
    progress: row.progress_status
      ? {
          status: row.progress_status,
          score: row.progress_score === null ? null : Number(row.progress_score),
          metadata: row.progress_metadata || {},
          startedAt: row.progress_started_at,
          completedAt: row.progress_completed_at,
          isCompleted: Boolean(row.progress_completed_at),
        }
      : null,
  };
}

function validateMaterialIds(materialIds) {
  const uniqueIds = [...new Set(materialIds.filter(Boolean))];

  if (uniqueIds.length > LESSON_MVP_LIMITS.maxSelectedMaterials) {
    throw new Error(
      `Select up to ${LESSON_MVP_LIMITS.maxSelectedMaterials} materials for the MVP.`
    );
  }

  return uniqueIds;
}

function normalizeLessonTitle(value) {
  const title = (value || '').trim();

  return title || 'Untitled theoretical lesson';
}

export async function createLessonDraft(input) {
  const materialIds = validateMaterialIds(input.materialIds || []);
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    await ensureLessonsSchema(client);

    const lessonId = crypto.randomUUID();
    const result = await client.query(
      `
        INSERT INTO lessons (
          id,
          title,
          description,
          status,
          user_instructions,
          depth,
          tone,
          desired_format,
          created_by
        )
        VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7, $8)
        RETURNING *
      `,
      [
        lessonId,
        normalizeLessonTitle(input.title),
        input.description || '',
        input.userInstructions || '',
        input.depth || 'standard',
        input.tone || 'clear',
        input.desiredFormat || 'structured theoretical lesson',
        input.createdBy || '',
      ]
    );

    for (let index = 0; index < materialIds.length; index += 1) {
      await client.query(
        `
          INSERT INTO lesson_materials (lesson_id, material_id, sort_order)
          VALUES ($1, $2, $3)
        `,
        [lessonId, materialIds[index], index]
      );
    }

    await client.query('COMMIT');

    return mapLesson(result.rows[0], materialIds);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function markLessonGenerating(lessonId, generationMetadata = {}) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      UPDATE lessons
      SET
        status = 'generating',
        generation_metadata = $2,
        error_message = '',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [lessonId, JSON.stringify(generationMetadata)]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const lesson = await getLessonById(lessonId);

  return lesson;
}

export async function markLessonReady(lessonId, input) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      UPDATE lessons
      SET
        title = COALESCE($4, title),
        status = 'ready',
        content_markdown = $2,
        generation_metadata = $3,
        content_html = $5,
        error_message = '',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      lessonId,
      input.contentMarkdown || '',
      JSON.stringify(input.generationMetadata || {}),
      input.title || null,
      input.contentHtml || '',
    ]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return getLessonById(lessonId);
}

export async function markLessonFailed(lessonId, input) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      UPDATE lessons
      SET
        status = 'failed',
        generation_metadata = $2,
        error_message = $3,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      lessonId,
      JSON.stringify(input.generationMetadata || {}),
      input.errorMessage || 'Lesson generation failed.',
    ]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return getLessonById(lessonId);
}

export async function updateLessonContent(lessonId, input) {
  await ensureLessonsSchema();

  const fields = [];
  const values = [lessonId];
  let index = 2;

  if (typeof input.title === 'string') {
    fields.push(`title = COALESCE($${index}, title)`);
    values.push(input.title || null);
    index += 1;
  }

  if (typeof input.contentHtml === 'string') {
    fields.push(`content_html = $${index}`);
    values.push(input.contentHtml);
    index += 1;
  }

  if (typeof input.contentMarkdown === 'string') {
    fields.push(`content_markdown = $${index}`);
    values.push(input.contentMarkdown);
    index += 1;
  }

  if (input.generationMetadata !== undefined) {
    fields.push(`generation_metadata = $${index}`);
    values.push(JSON.stringify(input.generationMetadata || {}));
    index += 1;
  }

  if (typeof input.errorMessage === 'string') {
    fields.push(`error_message = $${index}`);
    values.push(input.errorMessage);
    index += 1;
  }

  if (typeof input.status === 'string') {
    fields.push(`status = $${index}`);
    values.push(input.status);
    index += 1;
  }

  if (fields.length === 0) {
    return getLessonById(lessonId);
  }

  const result = await db.query(
    `
      UPDATE lessons
      SET
        ${fields.join(',\n        ')},
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    values
  );

  if (result.rowCount === 0) {
    return null;
  }

  return getLessonById(lessonId);
}

export async function deleteLessonById(lessonId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      DELETE FROM lessons
      WHERE id = $1
      RETURNING id
    `,
    [lessonId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    id: result.rows[0].id,
  };
}

export async function getEnrolledLessonIdsForUser(userId) {
  await ensureLessonsSchema();

  if (!userId) {
    return new Set();
  }

  const result = await db.query(
    `
      SELECT lesson_id
      FROM user_lessons
      WHERE user_id = $1
    `,
    [userId]
  );

  return new Set(result.rows.map((row) => row.lesson_id));
}

export async function enrollUserInLesson(userId, lessonId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      INSERT INTO user_lessons (user_id, lesson_id)
      SELECT $1, lessons.id
      FROM lessons
      WHERE lessons.id = $2
        AND lessons.status = 'ready'
      ON CONFLICT (user_id, lesson_id) DO UPDATE
        SET enrolled_at = user_lessons.enrolled_at
      RETURNING enrolled_at
    `,
    [userId, lessonId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    lessonId,
    enrolledAt: result.rows[0]?.enrolled_at || null,
  };
}

export async function setLessonCompletionForUser(userId, lessonId, isCompleted) {
  await ensureLessonsSchema();

  if (isCompleted) {
    const activities = await getLessonActivitiesForUser(lessonId, userId);

    if (activities.length > 0 && !activities.every(isActivityPassed)) {
      throw new Error('Complete all lesson activities before marking this lesson complete.');
    }
  }

  const result = await db.query(
    `
      UPDATE user_lessons
      SET completed_at = CASE WHEN $3::boolean THEN NOW() ELSE NULL END
      WHERE user_id = $1
        AND lesson_id = $2
      RETURNING lesson_id, enrolled_at, completed_at
    `,
    [userId, lessonId, Boolean(isCompleted)]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    lessonId: result.rows[0].lesson_id,
    enrolledAt: result.rows[0].enrolled_at,
    completedAt: result.rows[0].completed_at,
    isCompleted: Boolean(result.rows[0].completed_at),
  };
}

export async function getLessonEnrollmentForUser(userId, lessonId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      SELECT lesson_id, enrolled_at, completed_at
      FROM user_lessons
      WHERE user_id = $1
        AND lesson_id = $2
    `,
    [userId, lessonId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return {
    lessonId: result.rows[0].lesson_id,
    enrolledAt: result.rows[0].enrolled_at,
    completedAt: result.rows[0].completed_at,
    isCompleted: Boolean(result.rows[0].completed_at),
  };
}

export async function unenrollUserFromLesson(userId, lessonId) {
  await ensureLessonsSchema();

  await db.query(
    `
      DELETE FROM user_lessons
      WHERE user_id = $1
        AND lesson_id = $2
    `,
    [userId, lessonId]
  );
}

export async function getAllLessons(userId = null) {
  await ensureLessonsSchema();

  const lessonsResult = await db.query(`
    SELECT *
    FROM lessons
    ORDER BY created_at DESC
  `);

  const lessonMaterialsResult = await db.query(`
    SELECT lesson_id, material_id
    FROM lesson_materials
    ORDER BY sort_order ASC
  `);

  const enrollmentRows = userId
    ? await db.query(
        `
          SELECT lesson_id, enrolled_at, completed_at
          FROM user_lessons
          WHERE user_id = $1
        `,
        [userId]
      )
    : { rows: [] };
  const enrollmentsByLessonId = new Map(
    enrollmentRows.rows.map((row) => [row.lesson_id, row])
  );

  return lessonsResult.rows.map((lesson) => {
    const materialIds = lessonMaterialsResult.rows
      .filter((item) => item.lesson_id === lesson.id)
      .map((item) => item.material_id);
    const enrollment = enrollmentsByLessonId.get(lesson.id);

    return mapLesson(lesson, materialIds, {
      isEnrolled: Boolean(enrollment),
      enrolledAt: enrollment?.enrolled_at || null,
      completedAt: enrollment?.completed_at || null,
      isCompleted: Boolean(enrollment?.completed_at),
    });
  });
}

export async function getLessonsForUser(userId) {
  await ensureLessonsSchema();

  const lessonsResult = await db.query(
    `
      SELECT lessons.*, user_lessons.enrolled_at, user_lessons.completed_at
      FROM user_lessons
      JOIN lessons ON lessons.id = user_lessons.lesson_id
      WHERE user_lessons.user_id = $1
      ORDER BY user_lessons.completed_at ASC NULLS FIRST, user_lessons.enrolled_at DESC
    `,
    [userId]
  );

  const lessonIds = lessonsResult.rows.map((lesson) => lesson.id);

  if (lessonIds.length === 0) {
    return [];
  }

  const lessonMaterialsResult = await db.query(
    `
      SELECT lesson_id, material_id
      FROM lesson_materials
      WHERE lesson_id = ANY($1::text[])
      ORDER BY sort_order ASC
    `,
    [lessonIds]
  );

  return lessonsResult.rows.map((lesson) => {
    const materialIds = lessonMaterialsResult.rows
      .filter((item) => item.lesson_id === lesson.id)
      .map((item) => item.material_id);

    return mapLesson(lesson, materialIds, {
      isEnrolled: true,
      enrolledAt: lesson.enrolled_at,
      completedAt: lesson.completed_at,
      isCompleted: Boolean(lesson.completed_at),
    });
  });
}

export async function getLessonById(lessonId) {
  await ensureLessonsSchema();

  const lessonResult = await db.query(
    `
      SELECT *
      FROM lessons
      WHERE id = $1
    `,
    [lessonId]
  );

  if (lessonResult.rowCount === 0) {
    return null;
  }

  const lessonMaterialsResult = await db.query(
    `
      SELECT material_id
      FROM lesson_materials
      WHERE lesson_id = $1
      ORDER BY sort_order ASC
    `,
    [lessonId]
  );

  const activities = await getLessonActivities(lessonId);

  return mapLesson(
    lessonResult.rows[0],
    lessonMaterialsResult.rows.map((item) => item.material_id),
    { activities }
  );
}

export async function createLessonActivity(input) {
  await ensureLessonsSchema();

  const activityId = crypto.randomUUID();
  const result = await db.query(
    `
      INSERT INTO lesson_activities (
        id,
        lesson_id,
        type,
        title,
        item_count,
        payload,
        generation_metadata,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      activityId,
      input.lessonId,
      input.type,
      input.title || '',
      input.itemCount || 0,
      JSON.stringify(input.payload || {}),
      JSON.stringify(input.generationMetadata || {}),
      input.createdBy || '',
    ]
  );

  return mapLessonActivity(result.rows[0]);
}

export async function getLessonActivities(lessonId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      SELECT *
      FROM lesson_activities
      WHERE lesson_id = $1
      ORDER BY created_at DESC
    `,
    [lessonId]
  );

  return result.rows.map(mapLessonActivity);
}

export async function getLessonActivitiesForUser(lessonId, userId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      SELECT
        lesson_activities.*,
        user_lesson_activity_progress.status AS progress_status,
        user_lesson_activity_progress.score AS progress_score,
        user_lesson_activity_progress.metadata AS progress_metadata,
        user_lesson_activity_progress.started_at AS progress_started_at,
        user_lesson_activity_progress.completed_at AS progress_completed_at
      FROM lesson_activities
      LEFT JOIN user_lesson_activity_progress
        ON user_lesson_activity_progress.activity_id = lesson_activities.id
        AND user_lesson_activity_progress.user_id = $2
      WHERE lesson_activities.lesson_id = $1
      ORDER BY lesson_activities.created_at ASC
    `,
    [lessonId, userId]
  );

  return result.rows.map(mapLessonActivity);
}

export async function getLessonActivityForUser(lessonId, activityId, userId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      SELECT
        lesson_activities.*,
        user_lesson_activity_progress.status AS progress_status,
        user_lesson_activity_progress.score AS progress_score,
        user_lesson_activity_progress.metadata AS progress_metadata,
        user_lesson_activity_progress.started_at AS progress_started_at,
        user_lesson_activity_progress.completed_at AS progress_completed_at
      FROM lesson_activities
      LEFT JOIN user_lesson_activity_progress
        ON user_lesson_activity_progress.activity_id = lesson_activities.id
        AND user_lesson_activity_progress.user_id = $3
      WHERE lesson_activities.lesson_id = $1
        AND lesson_activities.id = $2
      LIMIT 1
    `,
    [lessonId, activityId, userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapLessonActivity(result.rows[0]);
}

function isActivityPassed(activity) {
  if (activity.type === 'quiz') {
    return Boolean(activity.progress?.completedAt) && Number(activity.progress?.score || 0) >= 80;
  }

  return Boolean(activity.progress?.completedAt);
}

export async function completeFlashcardsActivityForUser(userId, lessonId, activityId, metadata = {}) {
  await ensureLessonsSchema();

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const activityResult = await client.query(
      `
        SELECT id, lesson_id, type
        FROM lesson_activities
        WHERE id = $1
          AND lesson_id = $2
        LIMIT 1
      `,
      [activityId, lessonId]
    );

    if (activityResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const activityRow = activityResult.rows[0];

    if (activityRow.type !== 'flashcards') {
      throw new Error('Only flashcard activities can be completed with this action.');
    }

    const progressResult = await client.query(
      `
        INSERT INTO user_lesson_activity_progress (
          user_id,
          activity_id,
          lesson_id,
          status,
          score,
          metadata,
          completed_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'completed', NULL, $4, NOW(), NOW())
        ON CONFLICT (user_id, activity_id) DO UPDATE
          SET
            status = 'completed',
            score = NULL,
            metadata = EXCLUDED.metadata,
            completed_at = COALESCE(user_lesson_activity_progress.completed_at, NOW()),
            updated_at = NOW()
        RETURNING *
      `,
      [userId, activityId, lessonId, JSON.stringify(metadata || {})]
    );

    await client.query('COMMIT');

    const activities = await getLessonActivitiesForUser(lessonId, userId);
    const lessonCompleted = activities.length > 0 && activities.every(isActivityPassed);
    const enrollment = lessonCompleted
      ? await setLessonCompletionForUser(userId, lessonId, true)
      : await getLessonEnrollmentForUser(userId, lessonId);

    return {
      progress: {
        activityId: progressResult.rows[0].activity_id,
        lessonId: progressResult.rows[0].lesson_id,
        status: progressResult.rows[0].status,
        completedAt: progressResult.rows[0].completed_at,
        metadata: progressResult.rows[0].metadata,
      },
      activities,
      lessonCompleted,
      enrollment,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

export async function resetLessonActivityProgressForUser(userId, lessonId, activityId) {
  await ensureLessonsSchema();

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const activityResult = await client.query(
      `
        SELECT id
        FROM lesson_activities
        WHERE id = $1
          AND lesson_id = $2
        LIMIT 1
      `,
      [activityId, lessonId]
    );

    if (activityResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const progressResult = await client.query(
      `
        INSERT INTO user_lesson_activity_progress (
          user_id,
          activity_id,
          lesson_id,
          status,
          score,
          metadata,
          completed_at,
          updated_at
        )
        VALUES ($1, $2, $3, 'not_started', NULL, '{}'::jsonb, NULL, NOW())
        ON CONFLICT (user_id, activity_id) DO UPDATE
          SET
            status = 'not_started',
            score = NULL,
            metadata = '{}'::jsonb,
            completed_at = NULL,
            updated_at = NOW()
        RETURNING *
      `,
      [userId, activityId, lessonId]
    );

    await client.query(
      `
        UPDATE user_lessons
        SET completed_at = NULL
        WHERE user_id = $1
          AND lesson_id = $2
      `,
      [userId, lessonId]
    );

    await client.query('COMMIT');

    return {
      progress: {
        activityId: progressResult.rows[0].activity_id,
        lessonId: progressResult.rows[0].lesson_id,
        status: progressResult.rows[0].status,
        completedAt: progressResult.rows[0].completed_at,
        metadata: progressResult.rows[0].metadata,
      },
      enrollment: await getLessonEnrollmentForUser(userId, lessonId),
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
