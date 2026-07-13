import { registerAs } from '@nestjs/config';

/**
 * Redis / cache configuration stub.
 *
 * This starter ships WITHOUT a hard Redis dependency to stay lightweight.
 * To enable caching or a BullMQ queue:
 *   1. npm install ioredis @nestjs/cache-manager cache-manager cache-manager-redis-yet
 *      (and, for queues: @nestjs/bullmq bullmq)
 *   2. Add `RedisConfig` to the `load` array in `app.module.ts`.
 *   3. Uncomment the `CacheModule` / BullMQ imports in `app.module.ts`.
 */
export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  ttl: parseInt(process.env.REDIS_TTL || '60', 10),
}));
