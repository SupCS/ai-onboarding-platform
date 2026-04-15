import { S3Client } from '@aws-sdk/client-s3';

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