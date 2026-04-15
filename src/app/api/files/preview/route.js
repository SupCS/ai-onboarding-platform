import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { bucketName, storage } from '../../../../lib/storage';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get('storageKey');

    if (!storageKey) {
      return Response.json(
        { error: 'Storage key is required.' },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    });

    const previewUrl = await getSignedUrl(storage, command, {
      expiresIn: 60 * 60 * 24, // 24 hours
    });

    return Response.json({ previewUrl });
  } catch (error) {
    console.error('GET /api/files/preview failed:', error);

    return Response.json(
      { error: error.message || 'Failed to generate preview URL.' },
      { status: 500 }
    );
  }
}