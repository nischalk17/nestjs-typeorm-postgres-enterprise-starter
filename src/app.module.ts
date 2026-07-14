import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import throttleConfig from './config/throttle.config';
import uploadConfig from './config/upload.config';
import { envValidationSchema } from './config/env.validation';
import { buildDataSourceOptions } from './database/data-source.options';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { MailModule } from './modules/mail/mail.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UserModule } from './modules/users/user.module';

// -----------------------------------------------------------------------------
// OPTIONAL: Redis-backed caching. This starter ships without a hard Redis
// dependency. To enable:
//   1. npm i @nestjs/cache-manager cache-manager cache-manager-redis-yet
//   2. Uncomment the import + CacheModule.registerAsync block below.
//   3. redisConfig is already loaded in ConfigModule (see `load` array).
//
// import { CacheModule } from '@nestjs/cache-manager';
// import { redisStore } from 'cache-manager-redis-yet';
//
// CacheModule.registerAsync({
//   isGlobal: true,
//   inject: [ConfigService],
//   useFactory: async (config: ConfigService) => ({
//     store: await redisStore({
//       socket: { host: config.get('redis.host'), port: config.get('redis.port') },
//       password: config.get('redis.password'),
//       ttl: config.get('redis.ttl'),
//     }),
//   }),
// }),
//
// OPTIONAL: BullMQ background queues.
//   1. npm i @nestjs/bullmq bullmq
//   2. BullModule.forRootAsync({ inject: [ConfigService], useFactory: (c) => ({
//        connection: { host: c.get('redis.host'), port: c.get('redis.port') } }) })
//   3. Register queues per-module with BullModule.registerQueue({ name: 'my-queue' }).
// -----------------------------------------------------------------------------

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        mailConfig,
        uploadConfig,
        throttleConfig,
        redisConfig,
      ],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDataSourceOptions(),
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          // Must match `upload.dir` (UPLOAD_DIR) exactly — this is where
          // UploadsModule's Multer storage actually writes files.
          rootPath: resolve(config.get<string>('upload.dir', './uploads')),
          serveRoot: '/uploads',
          serveStaticOptions: {
            index: false,
            dotfiles: 'deny',
          },
        },
      ],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('throttle.ttl', 60000),
            limit: config.get<number>('throttle.limit', 100),
          },
        ],
      }),
    }),
    AuthModule,
    UserModule,
    UploadsModule,
    MailModule,
    HealthModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
