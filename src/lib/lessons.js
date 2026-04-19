import crypto from 'crypto';
import { db } from './db.js';
import { LESSON_MVP_LIMITS } from './lessonConstants.js';
export {
  LESSON_CONTENT_FORMAT,
  LESSON_MVP_LIMITS,
  LESSON_STATUSES,
} from './lessonConstants.js';

export async function ensureLessonsSchema(client = db) {
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
    CREATE TABLE IF NOT EXISTS lesson_materials (
      lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      material_id UUID NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (lesson_id, material_id)
    )
  `);
}

function mapLesson(row, materialIds = []) {
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
    generationMetadata: row.generation_metadata,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateMaterialIds(materialIds) {
  const uniqueIds = [...new Set(materialIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    throw new Error('Select at least one material.');
  }

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
        status = 'ready',
        content_markdown = $2,
        generation_metadata = $3,
        error_message = '',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      lessonId,
      input.contentMarkdown || '',
      JSON.stringify(input.generationMetadata || {}),
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

export async function getAllLessons() {
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

  return lessonsResult.rows.map((lesson) => {
    const materialIds = lessonMaterialsResult.rows
      .filter((item) => item.lesson_id === lesson.id)
      .map((item) => item.material_id);

    return mapLesson(lesson, materialIds);
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

  return mapLesson(
    lessonResult.rows[0],
    lessonMaterialsResult.rows.map((item) => item.material_id)
  );
}
