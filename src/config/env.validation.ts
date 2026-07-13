import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(9095),
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('1'),
  CORS_ORIGINS: Joi.string().optional(),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_SCHEMA: Joi.string().optional(),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.boolean().default(true),

  // JWT
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).optional(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),

  // Mail
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().optional(),
  MAIL_SECURE: Joi.boolean().optional(),
  MAIL_USERNAME: Joi.string().allow('').optional(),
  MAIL_PASSWORD: Joi.string().allow('').optional(),
  MAIL_FROM: Joi.string().optional(),

  // Upload
  UPLOAD_DIR: Joi.string().optional(),
  UPLOAD_MAX_SIZE_MB: Joi.number().optional(),
  UPLOAD_ALLOWED_MIMETYPES: Joi.string().optional(),

  // Throttle
  THROTTLE_ENABLED: Joi.boolean().optional(),
  THROTTLE_TTL: Joi.number().optional(),
  THROTTLE_LIMIT: Joi.number().optional(),
});
