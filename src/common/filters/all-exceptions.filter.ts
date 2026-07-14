import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { QueryFailedError } from 'typeorm';
import { IErrorResponse } from '../interfaces';

/** Postgres error codes we translate into meaningful 4xx responses. */
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';
const PG_NOT_NULL_VIOLATION = '23502';
const PG_CHECK_VIOLATION = '23514';

/** Human-readable messages for Multer's upload-time error codes. */
const MULTER_ERROR_MESSAGES: Record<string, string> = {
  LIMIT_FILE_SIZE: 'Uploaded file exceeds the maximum allowed size',
  LIMIT_FILE_COUNT: 'Too many files uploaded',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload',
  LIMIT_PART_COUNT: 'Too many parts in multipart upload',
  LIMIT_FIELD_KEY: 'Field name too long',
  LIMIT_FIELD_VALUE: 'Field value too long',
  LIMIT_FIELD_COUNT: 'Too many fields',
};

/** Single canonical exception filter emitting the standard error envelope. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errors: string[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else {
        const res = errorResponse as { message?: string | string[] };
        const raw = res.message ?? exception.message;
        if (Array.isArray(raw)) {
          errors = raw;
          message = raw[0] ?? exception.message;
        } else {
          message = raw;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Map common Postgres constraint violations to sensible 4xx codes
      // instead of leaking them as opaque 500s.
      const pgCode = (exception as QueryFailedError & { code?: string }).code;
      switch (pgCode) {
        case PG_UNIQUE_VIOLATION:
          status = HttpStatus.CONFLICT;
          message = 'A record with the same unique value already exists';
          break;
        case PG_FOREIGN_KEY_VIOLATION:
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record does not exist';
          break;
        case PG_NOT_NULL_VIOLATION:
        case PG_CHECK_VIOLATION:
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid data supplied';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Database query failed';
      }
      this.logger.warn(
        `QueryFailedError on ${request.method} ${request.url}: ${exception.message}`,
      );
    } else if (exception instanceof MulterError) {
      // Thrown directly by Multer (e.g. file-size limit) before Nest's
      // exception layer sees it — not an HttpException by default.
      status = HttpStatus.BAD_REQUEST;
      message = MULTER_ERROR_MESSAGES[exception.code] ?? exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const body: IErrorResponse = {
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(body);
  }
}
