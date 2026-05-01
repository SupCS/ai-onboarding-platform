import crypto from 'crypto';
import { requireApiUser } from '../../../../lib/apiAuth';
import { putStorageObject } from '../../../../lib/storage';

export const runtime = 'nodejs';

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(request) {
  try {
    const { response } = await requireApiUser();

    if (response) {
      return response;
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
