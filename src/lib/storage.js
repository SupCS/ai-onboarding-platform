import {
  DeleteObjectsCommand,
  GetObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function cleanEnvValue(value) {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

function getStorageRegion() {
  const region = cleanEnvValue(
    process.env.RAILWAY_BUCKET_REGION || process.env.REGION
  );

  return !region || region === 'auto' ? 'us-east-1' : region;
}

export const storage = new S3Client({
  region: getStorageRegion(),
  endpoint: cleanEnvValue(
    process.env.RAILWAY_BUCKET_ENDPOINT || process.env.ENDPOINT
  ),
  credentials: {
    accessKeyId: cleanEnvValue(
      process.env.RAILWAY_BUCKET_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID
    ),
    secretAccessKey: cleanEnvValue(
      process.env.RAILWAY_BUCKET_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
    ),
  },
});

export const bucketName = cleanEnvValue(
  process.env.RAILWAY_BUCKET_BUCKET || process.env.BUCKET
);

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

export async function getObjectBuffer(storageKey) {
  const result = await storage.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
    })
  );

  const chunks = [];

  for await (const chunk of result.Body) {
    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
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
