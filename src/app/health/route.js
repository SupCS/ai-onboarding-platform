export const runtime = 'nodejs';

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
    hasBucket: Boolean(process.env.BUCKET || process.env.RAILWAY_BUCKET_BUCKET),
    timestamp: new Date().toISOString(),
  });
}
