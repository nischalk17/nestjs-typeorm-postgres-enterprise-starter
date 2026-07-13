import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import compression from 'compression';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import {
  LoggingInterceptor,
  PageTransferResponseInterceptor,
  TimeoutInterceptor,
} from './common/interceptors';
import { winstonConfig } from './common/logger/winston.config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port', 9095);
  const apiPrefix = configService.get<string>('app.apiPrefix', 'api');
  const apiVersion = configService.get<string>('app.apiVersion', '1');
  const corsOrigins = configService.get<string[]>('app.corsOrigins', []);
  const ngrokOrigin = configService.get<string>('app.ngrokOrigin');
  const nodeEnv = configService.get<string>('app.env', 'development');

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  app.use(helmet());
  app.use(compression());
  app.use(RequestIdMiddleware);
  // Explicit request body size limits — defends against oversized-payload DoS.
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS — must be configured before any route/middleware registration.
  const isOriginAllowed = (requestOrigin: string): boolean => {
    if (corsOrigins.includes('*')) return true;
    if (ngrokOrigin && requestOrigin === ngrokOrigin) return true;

    let hostname: string;
    try {
      hostname = new URL(requestOrigin).hostname;
    } catch {
      return false;
    }

    return corsOrigins.some((allowed) => {
      if (allowed.startsWith('*.')) {
        const domain = allowed.slice(2);
        return hostname === domain || hostname.endsWith(`.${domain}`);
      }
      return requestOrigin === allowed;
    });
  };

  const corsOriginHandler: CorsOptions['origin'] = (
    requestOrigin,
    callback,
  ) => {
    // Same-origin / non-browser requests (curl, server-to-server) send no Origin header.
    if (!requestOrigin || isOriginAllowed(requestOrigin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin ${requestOrigin} not allowed by CORS`), false);
  };

  app.enableCors({
    origin: corsOriginHandler,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      disableErrorMessages: nodeEnv === 'production',
    }),
  );
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new PageTransferResponseInterceptor(),
  );

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Swagger API')
      .setDescription('API Documentation Swagger')
      .setExternalDoc('Postman Collection', '/docs-json')
      .setVersion('1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      jsonDocumentUrl: 'docs/json',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
      },
    });
  }

  app.enableShutdownHooks();

  await app.listen(port);

  const baseUrl = await app.getUrl();
  Logger.log(
    `|--------Server running at ${baseUrl}/${apiPrefix}/v${apiVersion}--------|`,
    'Bootstrap',
  );
  if (nodeEnv !== 'production') {
    Logger.log(
      `|--------Swagger docs at ${baseUrl}/docs--------|`,
      'Bootstrap',
    );
  }
}
void bootstrap();
