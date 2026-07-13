import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

/**
 * Validates route/query params that must be a positive integer (e.g. bigint
 * primary key path params: `/users/:id`). Unlike Nest's built-in
 * ParseIntPipe, this also rejects 0/negative values and non-integer floats.
 */
@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException(
        `${metadata.data ?? 'value'} must be a positive integer.`,
      );
    }

    return parsed;
  }
}
