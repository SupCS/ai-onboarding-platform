import crypto from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { requireApiUser } from '../../../../lib/apiAuth';
import { bucketName, storage } from '../../../../lib/storage';

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

    const body = await request.json();

    const fileName = (body.fileName || '').trim();
    const contentType = (body.contentType || '').trim();
    const size = Number(body.size || 0);

    if (!fileName) {
      return Response.json(
        { error: 'File name is required.' },
        { status: 400 }
      );
    }

    if (!contentType) {
      return Response.json(
        { error: 'Content type is required.' },
        { status: 400 }
      );
    }

    if (!size || size <= 0) {
      return Response.json(
        { error: 'File size is invalid.' },
        { status: 400 }
      );
    }

    const storageKey = `materials/temp/${Date.now()}-${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(storage, command, {
      expiresIn: 60 * 10,
    });

    return Response.json({
      uploadUrl,
      storageKey,
    });
  } catch (error) {
    console.error('POST /api/materials/upload-url failed:', error);

    return Response.json(
      { error: error.message || 'Failed to generate upload URL.' },
      { status: 500 }
    );
  }
}
