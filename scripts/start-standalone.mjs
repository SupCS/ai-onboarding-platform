if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
  process.env.HOSTNAME = '0.0.0.0';
}

await import('../.next/standalone/server.js');
