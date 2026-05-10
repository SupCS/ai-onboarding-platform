import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function cleanEnvValue(value) {
  return (value || '').trim().replace(/^["']|["']$/g, '');
}

function firstEnvValue(names = []) {
  for (const name of names) {
    const value = cleanEnvValue(process.env[name]);

    if (value) {
      return value;
    }
  }

  return '';
}

function getStorageRegion() {
  const region = firstEnvValue([
    'REGION',
    'AWS_REGION',
    'S3_REGION',
    'RAILWAY_BUCKET_REGION',
  ]);

  return !region || region === 'auto' ? 'us-east-1' : region;
}

export const storage = new S3Client({
  region: getStorageRegion(),
  endpoint: firstEnvValue([
    'ENDPOINT',
    'AWS_ENDPOINT',
    'S3_ENDPOINT',
    'RAILWAY_BUCKET_ENDPOINT',
  ]),
  credentials: {
    accessKeyId: firstEnvValue([
      'ACCESS_KEY_ID',
      'AWS_ACCESS_KEY_ID',
      'S3_ACCESS_KEY_ID',
      'RAILWAY_BUCKET_ACCESS_KEY_ID',
    ]),
    secretAccessKey: firstEnvValue([
      'SECRET_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'S3_SECRET_ACCESS_KEY',
      'RAILWAY_BUCKET_SECRET_ACCESS_KEY',
    ]),
  },
});

export const bucketName = firstEnvValue([
  'BUCKET',
  'AWS_BUCKET',
  'S3_BUCKET',
  'RAILWAY_BUCKET_BUCKET',
]);

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

export async function putStorageObject(storageKey, body, options = {}) {
  await storage.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      Body: body,
      ContentType: options.contentType || 'application/octet-stream',
    })
  );
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
