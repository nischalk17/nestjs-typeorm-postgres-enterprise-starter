import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const port = parseInt(process.env.PORT || '9095', 10);

  return {
    env: process.env.NODE_ENV || 'development',
    port,
    // Public base URL used to build absolute links (e.g. uploaded file URLs)
    // returned in API responses. Set explicitly in production (e.g. behind
    // a reverse proxy/CDN) — defaults to localhost for local dev.
    baseUrl: process.env.APP_URL || `http://localhost:${port}`,
    apiPrefix: process.env.API_PREFIX || 'api',
    apiVersion: process.env.API_VERSION || '1',
    corsOrigins: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
          .map((o) => o.trim())
          .filter((o) => o.length > 0)
      : ['http://localhost:3000', 'http://localhost:5173'],
    // Extra single origin allowed regardless of the CORS_ORIGINS list, e.g. a
    // rotating ngrok tunnel URL used for local mobile/webhook testing.
    ngrokOrigin: process.env.NGROK_ORIGIN?.trim() || undefined,
  };
});
