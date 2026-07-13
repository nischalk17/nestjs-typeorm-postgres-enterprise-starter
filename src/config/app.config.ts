import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '9095', 10),
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
}));
