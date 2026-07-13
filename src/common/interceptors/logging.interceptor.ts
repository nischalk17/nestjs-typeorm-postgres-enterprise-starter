import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

/** Logs each request's method, url, status code and response time. */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const { method, originalUrl } = req;
    const requestId = req.id ? ` [${req.id}]` : '';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = http.getResponse<Response>();
        const ms = Date.now() - start;
        this.logger.log(
          `${method} ${originalUrl} ${res.statusCode} - ${ms}ms${requestId}`,
        );
      }),
    );
  }
}
