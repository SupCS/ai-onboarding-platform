import crypto from 'crypto';
import { requireApiUser } from '../../../../lib/apiAuth';
import { putStorageObject } from '../../../../lib/storage';
import { PERMISSIONS, requirePermission } from '../../../../lib/permissions';

export const runtime = 'nodejs';

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const forbidden = await requirePermission(user, PERMISSIONS.LESSONS_MANAGE_ASSETS);

    if (forbidden) {
      return forbidden;
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json(
        { error: 'File is required.' },
        { status: 400 }
      );
    }

    if (!file.name || !file.size || file.size <= 0) {
      return Response.json(
        { error: 'File name and size are required.' },
        { status: 400 }
      );
    }

    const storageKey = `lessons/assets/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await putStorageObject(storageKey, buffer, {
      contentType: file.type || 'application/octet-stream',
    });

    return Response.json({
      storageKey,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    });
  } catch (error) {
    console.error('POST /api/lessons/upload-file failed:', error);

    return Response.json(
      { error: error.message || 'Failed to upload file.' },
      { status: 500 }
    );
  }
}
