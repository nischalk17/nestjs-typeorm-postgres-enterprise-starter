import { registerAs } from '@nestjs/config';

export default registerAs('throttle', () => ({
  enabled: process.env.THROTTLE_ENABLED
    ? process.env.THROTTLE_ENABLED === 'true'
    : process.env.NODE_ENV === 'production',
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));
