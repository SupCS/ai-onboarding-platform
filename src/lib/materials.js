import { db } from './db';
import crypto from 'crypto';

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
  }));
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
      [
        materialId,
        input.title,
        input.description || '',
        input.text || '',
      ]
    );

    for (let index = 0; index < input.youtubeUrls.length; index += 1) {
      await client.query(
        `
          INSERT INTO material_youtube_urls (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.youtubeUrls[index], index]
      );
    }

    for (let index = 0; index < input.links.length; index += 1) {
      await client.query(
        `
          INSERT INTO material_links (id, material_id, url, sort_order)
          VALUES ($1, $2, $3, $4)
        `,
        [crypto.randomUUID(), materialId, input.links[index], index]
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