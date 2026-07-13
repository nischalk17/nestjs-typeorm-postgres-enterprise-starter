import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_SECRET,
  accessExpiresIn: process.env.JWT_EXPIRATION || '15m',
  refreshSecret:
    process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
}));
