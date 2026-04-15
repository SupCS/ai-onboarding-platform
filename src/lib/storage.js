import {
  DeleteObjectsCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const storage = new S3Client({
  region: process.env.RAILWAY_BUCKET_REGION || process.env.REGION || 'auto',
  endpoint: process.env.RAILWAY_BUCKET_ENDPOINT || process.env.ENDPOINT,
  credentials: {
    accessKeyId:
      process.env.RAILWAY_BUCKET_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey:
      process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY,
  },
});

export const bucketName =
  process.env.RAILWAY_BUCKET_BUCKET || process.env.BUCKET;

export async function getObjectUrl(storageKey, options = {}) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: storageKey,
  });

  return getSignedUrl(storage, command, {
    expiresIn: options.expiresIn ?? 60 * 60 * 24,
  });
}

export async function getPreviewUrl(storageKey, options = {}) {
  return getObjectUrl(storageKey, options);
}

export async function deleteStorageObjects(storageKeys = []) {
  const uniqueKeys = [...new Set(storageKeys.filter(Boolean))];

  if (uniqueKeys.length === 0) {
    return;
  }

  await storage.send(
    new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: uniqueKeys.map((Key) => ({ Key })),
        Quiet: true,
      },
    })
  );
}
