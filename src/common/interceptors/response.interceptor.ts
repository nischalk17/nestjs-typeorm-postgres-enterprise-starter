import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  IMeta,
  ISuccessResponse,
  ISuccessResponseMultiple,
} from '../interfaces';
import { buildMeta } from '../utils/pagination.util';

export class SuccessResponse<T> implements ISuccessResponse<T> {
  status: HttpStatus = HttpStatus.OK;
  message = 'success';
  data: T;

  constructor({
    data,
    message,
    status,
  }: Partial<ISuccessResponse<T>> & { data: T }) {
    this.data =
      data && typeof data === 'object' && Object.keys(data).length === 0
        ? (null as unknown as T)
        : data;
    if (message) this.message = message;
    if (status) this.status = status;
  }
}

export class SuccessResponseMultiple<T> implements ISuccessResponseMultiple<T> {
  status: HttpStatus = HttpStatus.OK;
  message = 'success';
  meta: IMeta;
  data: T[] = [];

  constructor({
    data,
    message,
    meta,
    status,
  }: Partial<ISuccessResponseMultiple<T>> & { data: T[]; meta: IMeta }) {
    if (data) this.data = data;
    if (message) this.message = message;
    this.meta = meta;
    if (status) this.status = status;
  }
}

/**
 * Wraps handler results in a standard envelope. If a handler returns a
 * TypeORM-style tuple `[items, totalCount]`, it is treated as a paginated
 * response and given pagination `meta`.
 */
@Injectable()
export class PageTransferResponseInterceptor<T> implements NestInterceptor<
  T,
  SuccessResponseMultiple<T> | SuccessResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponseMultiple<T> | SuccessResponse<T>> {
    const req = context.switchToHttp().getRequest();
    const { query } = req;

    return next.handle().pipe(
      map((responseObject) => {
        const response = context.switchToHttp().getResponse();
        if (
          Array.isArray(responseObject) &&
          typeof responseObject[1] === 'number'
        ) {
          const [items, totalItems] = responseObject;
          const page = Number(query?.page) || 1;
          const take = Number(query?.take) || totalItems || 1;
          const meta = buildMeta(totalItems, page, take);
          return new SuccessResponseMultiple({
            status: response.statusCode,
            message: req.customMessage || 'success',
            meta,
            data: items,
          });
        }

        const message = responseObject?.message;
        if (responseObject && typeof responseObject === 'object') {
          delete responseObject.message;
        }
        return new SuccessResponse({
          status: response.statusCode || responseObject?.status || 200,
          message: req.customMessage || message || 'success',
          data: responseObject?.data ?? responseObject ?? null,
        });
      }),
    );
  }
}
