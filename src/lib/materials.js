import crypto from 'crypto';
import { db } from './db.js';

export async function getAllMaterials() {
  const materialsResult = await db.query(`
    SELECT id, title, description, text_content, created_at, updated_at
    FROM materials
    ORDER BY created_at DESC
  `);

  const youtubeResult = await db.query(`
    SELECT material_id, url, sort_order
    FROM material_youtube_urls
    ORDER BY sort_order ASC
  `);

  const linksResult = await db.query(`
    SELECT material_id, url, sort_order
    FROM material_links
    ORDER BY sort_order ASC
  `);

  const filesResult = await db.query(`
    SELECT material_id, id, original_name, storage_key, mime_type, size_bytes, kind
    FROM material_files
    ORDER BY created_at ASC
  `);

  return materialsResult.rows.map((material) => ({
    id: material.id,
    title: material.title,
    description: material.description || '',
    text: material.text_content || '',
    createdAt: material.created_at,
    updatedAt: material.updated_at,
    youtubeUrls: youtubeResult.rows
      .filter((item) => item.material_id === material.id)
      .map((item) => item.url),
    links: linksResult.rows
      .filter((item) => item.material_id === material.id)
      .map((item) => item.url),
    attachments: filesResult.rows
      .filter((item) => item.material_id === material.id)
      .map((item) => ({
        id: item.id,
        name: item.original_name,
        storageKey: item.storage_key,
        mimeType: item.mime_type,
        size: Number(item.size_bytes || 0),
        kind: item.kind,
      })),
  }));
}

export async function getMaterialsByIds(materialIds = []) {
  const uniqueIds = [...new Set(materialIds.filter(Boolean))];

  if (uniqueIds.length === 0) {
    return [];
  }

  const materials = await getAllMaterials();
  const materialById = new Map(materials.map((material) => [material.id, material]));

  return uniqueIds
    .map((materialId) => materialById.get(materialId))
    .filter(Boolean);
}

export async function createMaterial(input) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const materialId = crypto.randomUUID();

    await client.query(
      `
        INSERT INTO materials (id, title, description, text_content)
        VALUES ($1, $2, $3, $4)
      `,
      [materialId, input.title, input.description || '', input.text || '']
    );

    for (let index = 0; index < (input.youtubeUrls || []).length; index += 1) {
      await client.query(
        `
          INSERT INTO material_youtube_urls (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.youtubeUrls[index], index]
      );
    }

    for (let index = 0; index < (input.links || []).length; index += 1) {
      await client.query(
        `
          INSERT INTO material_links (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.links[index], index]
      );
    }

    for (const attachment of input.attachments || []) {
      await client.query(
        `
          INSERT INTO material_files (
            id,
            material_id,
            original_name,
            storage_key,
            mime_type,
            size_bytes,
            kind
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          crypto.randomUUID(),
          materialId,
          attachment.originalName,
          attachment.storageKey,
          attachment.mimeType || '',
          attachment.sizeBytes || 0,
          attachment.kind,
        ]
      );
    }

    await client.query('COMMIT');
    return { id: materialId };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMaterialById(materialId) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const materialResult = await client.query(
      `
        SELECT id
        FROM materials
        WHERE id = $1
      `,
      [materialId]
    );

    if (materialResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const filesResult = await client.query(
      `
        SELECT storage_key
        FROM material_files
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM material_youtube_urls
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM material_links
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM material_files
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM materials
        WHERE id = $1
      `,
      [materialId]
    );

    await client.query('COMMIT');

    return {
      id: materialId,
      storageKeys: filesResult.rows.map((item) => item.storage_key).filter(Boolean),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateMaterialById(materialId, input) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const materialResult = await client.query(
      `
        SELECT id
        FROM materials
        WHERE id = $1
      `,
      [materialId]
    );

    if (materialResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const existingFilesResult = await client.query(
      `
        SELECT storage_key
        FROM material_files
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        UPDATE materials
        SET
          title = $2,
          description = $3,
          text_content = $4,
          updated_at = NOW()
        WHERE id = $1
      `,
      [materialId, input.title, input.description || '', input.text || '']
    );

    await client.query(
      `
        DELETE FROM material_youtube_urls
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM material_links
        WHERE material_id = $1
      `,
      [materialId]
    );

    await client.query(
      `
        DELETE FROM material_files
        WHERE material_id = $1
      `,
      [materialId]
    );

    for (let index = 0; index < (input.youtubeUrls || []).length; index += 1) {
      await client.query(
        `
          INSERT INTO material_youtube_urls (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.youtubeUrls[index], index]
      );
    }

    for (let index = 0; index < (input.links || []).length; index += 1) {
      await client.query(
        `
          INSERT INTO material_links (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.links[index], index]
      );
    }

    for (const attachment of input.attachments || []) {
      await client.query(
        `
          INSERT INTO material_files (
            id,
            material_id,
            original_name,
            storage_key,
            mime_type,
            size_bytes,
            kind
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          attachment.id || crypto.randomUUID(),
          materialId,
          attachment.originalName,
          attachment.storageKey,
          attachment.mimeType || '',
          attachment.sizeBytes || 0,
          attachment.kind,
        ]
      );
    }

    await client.query('COMMIT');

    const keptStorageKeys = new Set(
      (input.attachments || []).map((attachment) => attachment.storageKey).filter(Boolean)
    );

    return {
      id: materialId,
      removedStorageKeys: existingFilesResult.rows
        .map((item) => item.storage_key)
        .filter((storageKey) => storageKey && !keptStorageKeys.has(storageKey)),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
