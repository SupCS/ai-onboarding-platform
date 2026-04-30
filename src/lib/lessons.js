import crypto from 'crypto';
import { db } from './db.js';
import { ensureAuthSchema } from './auth.js';
import { fetchLinkMetadata } from './linkMetadata.js';
import { fetchYoutubeOEmbedMetadata } from './youtubeMetadata.js';
import { LESSON_MVP_LIMITS } from './lessonConstants.js';
export {
  LESSON_CONTENT_FORMAT,
  LESSON_MVP_LIMITS,
  LESSON_STATUSES,
} from './lessonConstants.js';

const LESSONS_SCHEMA_VERSION = 4;

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

  await client.query(`
    CREATE TABLE IF NOT EXISTS user_lesson_activity_attempts (
      id TEXT PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id TEXT NOT NULL REFERENCES lesson_activities(id) ON DELETE CASCADE,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      attempt_number INTEGER NOT NULL,
      score NUMERIC,
      passed BOOLEAN NOT NULL DEFAULT false,
      correct_count INTEGER NOT NULL DEFAULT 0,
      total_count INTEGER NOT NULL DEFAULT 0,
      submitted_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
      results JSONB NOT NULL DEFAULT '[]'::jsonb,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT user_lesson_activity_attempts_type_check
        CHECK (type IN ('quiz', 'flashcards')),
      CONSTRAINT user_lesson_activity_attempts_number_unique
        UNIQUE (user_id, activity_id, attempt_number)
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS user_lesson_activity_attempts_user_activity_idx
    ON user_lesson_activity_attempts(user_id, activity_id, created_at DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS user_lesson_activity_attempts_lesson_idx
    ON user_lesson_activity_attempts(user_id, lesson_id, created_at DESC)
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS lesson_assets (
      id TEXT PRIMARY KEY,
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      site_name TEXT NOT NULL DEFAULT '',
      original_name TEXT NOT NULL DEFAULT '',
      storage_key TEXT NOT NULL DEFAULT '',
      mime_type TEXT NOT NULL DEFAULT '',
      size_bytes BIGINT NOT NULL DEFAULT 0,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT lesson_assets_kind_check
        CHECK (kind IN ('link', 'youtube', 'image', 'file'))
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS lesson_assets_lesson_id_idx
    ON lesson_assets(lesson_id, created_at ASC)
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

function mapLessonAsset(row) {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    kind: row.kind,
    title: row.title || '',
    name: row.original_name || row.title || 'Untitled asset',
    url: row.url || '',
    description: row.description || '',
    imageUrl: row.image_url || '',
    siteName: row.site_name || '',
    storageKey: row.storage_key || '',
    mimeType: row.mime_type || '',
    size: Number(row.size_bytes || 0),
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
}

function mapLessonActivitySummary(row) {
  return {
    id: row.id,
    lessonId: row.lesson_id,
    type: row.type,
    title: row.title,
    itemCount: row.item_count,
    progress: row.progress_status
      ? {
          status: row.progress_status,
          score: row.progress_score === null ? null : Number(row.progress_score),
          startedAt: row.progress_started_at,
          completedAt: row.progress_completed_at,
          isCompleted: Boolean(row.progress_completed_at),
        }
      : null,
  };
}

function mapLessonActivityAttempt(row) {
  return {
    id: row.id,
    userId: row.user_id,
    lessonId: row.lesson_id,
    activityId: row.activity_id,
    type: row.type,
    attemptNumber: row.attempt_number,
    score: row.score === null ? null : Number(row.score),
    passed: Boolean(row.passed),
    correctCount: row.correct_count,
    totalCount: row.total_count,
    submittedAnswers: row.submitted_answers || [],
    results: row.results || [],
    metadata: row.metadata || {},
    createdAt: row.created_at,
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

  const roadmapUsageResult = await db.query(
    `
      SELECT roadmaps.title
      FROM roadmap_lessons
      JOIN roadmaps ON roadmaps.id = roadmap_lessons.roadmap_id
      WHERE roadmap_lessons.lesson_id = $1
      ORDER BY roadmaps.title ASC
      LIMIT 3
    `,
    [lessonId]
  );
  const roadmapUsageCountResult = await db.query(
    `
      SELECT COUNT(*)::int AS count
      FROM roadmap_lessons
      WHERE lesson_id = $1
    `,
    [lessonId]
  );
  const roadmapUsageCount = Number(roadmapUsageCountResult.rows[0]?.count || 0);

  if (roadmapUsageCount > 0) {
    const roadmapTitles = roadmapUsageResult.rows
      .map((row) => row.title)
      .filter(Boolean);
    const titleList = roadmapTitles.map((title) => `"${title}"`).join(', ');
    const suffix = roadmapUsageCount > roadmapTitles.length ? ', and more' : '';

    throw new Error(
      `This lesson cannot be deleted because it is used in ${titleList}${suffix}. Remove it from the roadmap first.`
    );
  }

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

export async function createLessonAsset(lessonId, input = {}) {
  await ensureLessonsSchema();

  const lesson = await getLessonById(lessonId);

  if (!lesson) {
    return null;
  }

  const kind = input.kind;

  if (!['link', 'youtube', 'image', 'file'].includes(kind)) {
    throw new Error('Unsupported lesson asset type.');
  }

  let asset = {
    kind,
    title: input.title || '',
    url: input.url || '',
    description: input.description || '',
    imageUrl: input.imageUrl || '',
    siteName: input.siteName || '',
    originalName: input.originalName || '',
    storageKey: input.storageKey || '',
    mimeType: input.mimeType || '',
    sizeBytes: Number(input.sizeBytes || 0),
    metadata: input.metadata || {},
  };

  if (kind === 'youtube') {
    const metadata = await fetchYoutubeOEmbedMetadata(asset.url);
    asset = {
      ...asset,
      title: asset.title || metadata.title || 'YouTube video',
      description: asset.description || metadata.authorName || '',
      imageUrl: asset.imageUrl || metadata.thumbnailUrl || '',
      siteName: metadata.providerName || 'YouTube',
      metadata: {
        ...asset.metadata,
        authorName: metadata.authorName || '',
        authorUrl: metadata.authorUrl || '',
        metadataError: metadata.error || '',
      },
    };
  }

  if (kind === 'link') {
    const metadata = await fetchLinkMetadata(asset.url);
    asset = {
      ...asset,
      title: asset.title || metadata.title || metadata.siteName || 'Web link',
      description: asset.description || metadata.description || '',
      imageUrl: asset.imageUrl || metadata.imageUrl || '',
      siteName: asset.siteName || metadata.siteName || '',
      metadata: {
        ...asset.metadata,
        extractedText: metadata.extractedText || '',
        metadataError: metadata.error || '',
      },
    };
  }

  if ((kind === 'image' || kind === 'file') && !asset.storageKey) {
    throw new Error('File storage key is required.');
  }

  const result = await db.query(
    `
      INSERT INTO lesson_assets (
        id,
        lesson_id,
        kind,
        title,
        url,
        description,
        image_url,
        site_name,
        original_name,
        storage_key,
        mime_type,
        size_bytes,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `,
    [
      crypto.randomUUID(),
      lessonId,
      asset.kind,
      asset.title,
      asset.url,
      asset.description,
      asset.imageUrl,
      asset.siteName,
      asset.originalName,
      asset.storageKey,
      asset.mimeType,
      asset.sizeBytes,
      JSON.stringify(asset.metadata || {}),
    ]
  );

  return mapLessonAsset(result.rows[0]);
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

  const lessonAssetsResult = await db.query(`
    SELECT *
    FROM lesson_assets
    ORDER BY lesson_id ASC, created_at ASC
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
    const lessonAssets = lessonAssetsResult.rows
      .filter((item) => item.lesson_id === lesson.id)
      .map(mapLessonAsset);
    const enrollment = enrollmentsByLessonId.get(lesson.id);

    return mapLesson(lesson, materialIds, {
      lessonAssets,
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

  const lessonActivitiesResult = await db.query(
    `
      SELECT
        lesson_activities.id,
        lesson_activities.lesson_id,
        lesson_activities.type,
        lesson_activities.title,
        lesson_activities.item_count,
        lesson_activities.created_at,
        user_lesson_activity_progress.status AS progress_status,
        user_lesson_activity_progress.score AS progress_score,
        user_lesson_activity_progress.started_at AS progress_started_at,
        user_lesson_activity_progress.completed_at AS progress_completed_at
      FROM lesson_activities
      LEFT JOIN user_lesson_activity_progress
        ON user_lesson_activity_progress.activity_id = lesson_activities.id
        AND user_lesson_activity_progress.user_id = $2
      WHERE lesson_activities.lesson_id = ANY($1::text[])
      ORDER BY
        lesson_activities.lesson_id,
        CASE lesson_activities.type WHEN 'flashcards' THEN 0 WHEN 'quiz' THEN 1 ELSE 2 END,
        lesson_activities.created_at ASC
    `,
    [lessonIds, userId]
  );

  const activitiesByLessonId = new Map();

  lessonActivitiesResult.rows.forEach((activityRow) => {
    const activities = activitiesByLessonId.get(activityRow.lesson_id) || [];
    activities.push(mapLessonActivitySummary(activityRow));
    activitiesByLessonId.set(activityRow.lesson_id, activities);
  });

  return lessonsResult.rows.map((lesson) => {
    const materialIds = lessonMaterialsResult.rows
      .filter((item) => item.lesson_id === lesson.id)
      .map((item) => item.material_id);

    return mapLesson(lesson, materialIds, {
      isEnrolled: true,
      enrolledAt: lesson.enrolled_at,
      completedAt: lesson.completed_at,
      isCompleted: Boolean(lesson.completed_at),
      activities: activitiesByLessonId.get(lesson.id) || [],
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
  const assetsResult = await db.query(
    `
      SELECT *
      FROM lesson_assets
      WHERE lesson_id = $1
      ORDER BY created_at ASC
    `,
    [lessonId]
  );

  return mapLesson(
    lessonResult.rows[0],
    lessonMaterialsResult.rows.map((item) => item.material_id),
    {
      activities,
      lessonAssets: assetsResult.rows.map(mapLessonAsset),
    }
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
      ORDER BY
        CASE type WHEN 'flashcards' THEN 0 WHEN 'quiz' THEN 1 ELSE 2 END,
        created_at ASC
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
      ORDER BY
        CASE lesson_activities.type WHEN 'flashcards' THEN 0 WHEN 'quiz' THEN 1 ELSE 2 END,
        lesson_activities.created_at ASC
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

export async function getLessonActivityAttemptsForUser(lessonId, activityId, userId) {
  await ensureLessonsSchema();

  const result = await db.query(
    `
      SELECT *
      FROM user_lesson_activity_attempts
      WHERE user_id = $1
        AND lesson_id = $2
        AND activity_id = $3
      ORDER BY attempt_number DESC
    `,
    [userId, lessonId, activityId]
  );

  return result.rows.map(mapLessonActivityAttempt);
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

function getQuizItems(activityPayload) {
  return Array.isArray(activityPayload?.items) ? activityPayload.items : [];
}

function calculateQuizAttempt(activityPayload, submittedAnswers = []) {
  const items = getQuizItems(activityPayload);
  const answers = Array.isArray(submittedAnswers) ? submittedAnswers : [];
  let correctCount = 0;

  const results = items.map((item, index) => {
    const options = Array.isArray(item.options) ? item.options : [];
    const selectedAnswer = typeof answers[index] === 'string' ? answers[index].trim() : '';
    const correctAnswer = typeof item.correctAnswer === 'string' ? item.correctAnswer.trim() : '';
    const isCorrect = Boolean(selectedAnswer) && selectedAnswer === correctAnswer;

    if (isCorrect) {
      correctCount += 1;
    }

    return {
      question: item.question || '',
      options,
      selectedAnswer,
      correctAnswer,
      isCorrect,
      explanation: item.explanation || '',
    };
  });

  const score = items.length === 0 ? 0 : Math.round((correctCount / items.length) * 100);

  return {
    score,
    passed: score >= 80,
    correctCount,
    totalCount: items.length,
    results,
  };
}

export async function completeQuizActivityForUser(userId, lessonId, activityId, submittedAnswers = []) {
  await ensureLessonsSchema();

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const activityResult = await client.query(
      `
        SELECT id, lesson_id, type, payload
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

    if (activityRow.type !== 'quiz') {
      throw new Error('Only quiz activities can be completed with this action.');
    }

    const attempt = calculateQuizAttempt(activityRow.payload, submittedAnswers);

    if (attempt.totalCount === 0) {
      throw new Error('This quiz has no questions.');
    }

    const metadata = {
      submittedAt: new Date().toISOString(),
      completedFrom: 'quiz-player',
      correctCount: attempt.correctCount,
      totalCount: attempt.totalCount,
      passed: attempt.passed,
      results: attempt.results,
    };

    const attemptNumberResult = await client.query(
      `
        SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next_attempt_number
        FROM user_lesson_activity_attempts
        WHERE user_id = $1
          AND activity_id = $2
      `,
      [userId, activityId]
    );
    const attemptNumber = Number(attemptNumberResult.rows[0]?.next_attempt_number || 1);

    const attemptResult = await client.query(
      `
        INSERT INTO user_lesson_activity_attempts (
          id,
          user_id,
          activity_id,
          lesson_id,
          type,
          attempt_number,
          score,
          passed,
          correct_count,
          total_count,
          submitted_answers,
          results,
          metadata
        )
        VALUES ($1, $2, $3, $4, 'quiz', $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
      [
        crypto.randomUUID(),
        userId,
        activityId,
        lessonId,
        attemptNumber,
        attempt.score,
        attempt.passed,
        attempt.correctCount,
        attempt.totalCount,
        JSON.stringify(submittedAnswers || []),
        JSON.stringify(attempt.results),
        JSON.stringify(metadata),
      ]
    );

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
        VALUES (
          $1,
          $2,
          $3,
          CASE WHEN $4::boolean THEN 'completed' ELSE 'failed' END,
          $5,
          $6,
          CASE WHEN $4::boolean THEN NOW() ELSE NULL END,
          NOW()
        )
        ON CONFLICT (user_id, activity_id) DO UPDATE
          SET
            status = CASE WHEN $4::boolean THEN 'completed' ELSE 'failed' END,
            score = EXCLUDED.score,
            metadata = EXCLUDED.metadata,
            completed_at = CASE WHEN $4::boolean THEN NOW() ELSE NULL END,
            updated_at = NOW()
        RETURNING *
      `,
      [
        userId,
        activityId,
        lessonId,
        attempt.passed,
        attempt.score,
        JSON.stringify(metadata),
      ]
    );

    if (!attempt.passed) {
      await client.query(
        `
          UPDATE user_lessons
          SET completed_at = NULL
          WHERE user_id = $1
            AND lesson_id = $2
        `,
        [userId, lessonId]
      );
    }

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
        score: progressResult.rows[0].score === null ? null : Number(progressResult.rows[0].score),
        completedAt: progressResult.rows[0].completed_at,
        metadata: progressResult.rows[0].metadata,
      },
      activities,
      lessonCompleted,
      enrollment,
      attempt: {
        ...attempt,
        ...mapLessonActivityAttempt(attemptResult.rows[0]),
      },
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
