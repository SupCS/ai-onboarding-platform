import crypto from 'crypto';
import { requireApiUser } from '../../../../lib/apiAuth';
import { putStorageObject } from '../../../../lib/storage';

export const runtime = 'nodejs';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function extensionForType(mimeType = '') {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  return mimeType.split('/')[1] || 'image';
}

export async function POST(request) {
  try {
    const { user, response } = await requireApiUser();

    if (response) {
      return response;
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json(
        { error: 'Avatar file is required.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return Response.json(
        { error: 'Upload a JPG, PNG, WEBP, or GIF image.' },
        { status: 400 }
      );
    }

    if (!file.size || file.size > MAX_AVATAR_SIZE_BYTES) {
      return Response.json(
        { error: 'Avatar must be smaller than 2 MB.' },
        { status: 400 }
      );
    }

    const extension = extensionForType(file.type);
    const storageKey = `profiles/${user.id}/avatar-${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await putStorageObject(storageKey, buffer, {
      contentType: file.type,
    });

    return Response.json({ storageKey });
  } catch (error) {
    console.error('POST /api/profile/avatar failed:', error);

    return Response.json(
      { error: error.message || 'Failed to upload avatar.' },
      { status: 500 }
    );
  }
}
