export const runtime = 'nodejs';

function hasAnyEnv(names = []) {
  return names.some((name) => Boolean((process.env[name] || '').trim()));
}

export function GET() {
  return Response.json({
    ok: true,
    service: 'ai-onboarding-platform',
    uptime: process.uptime(),
    nodeEnv: process.env.NODE_ENV || '',
    port: process.env.PORT || '',
    hostname: process.env.HOSTNAME || '',
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    hasBucket: hasAnyEnv(['BUCKET', 'AWS_BUCKET', 'S3_BUCKET', 'RAILWAY_BUCKET_BUCKET']),
    hasBucketEndpoint: hasAnyEnv(['ENDPOINT', 'AWS_ENDPOINT', 'S3_ENDPOINT', 'RAILWAY_BUCKET_ENDPOINT']),
    hasBucketAccessKeyId: hasAnyEnv([
      'ACCESS_KEY_ID',
      'AWS_ACCESS_KEY_ID',
      'S3_ACCESS_KEY_ID',
      'RAILWAY_BUCKET_ACCESS_KEY_ID',
    ]),
    hasBucketSecretAccessKey: hasAnyEnv([
      'SECRET_ACCESS_KEY',
      'AWS_SECRET_ACCESS_KEY',
      'S3_SECRET_ACCESS_KEY',
      'RAILWAY_BUCKET_SECRET_ACCESS_KEY',
    ]),
    timestamp: new Date().toISOString(),
  });
}
