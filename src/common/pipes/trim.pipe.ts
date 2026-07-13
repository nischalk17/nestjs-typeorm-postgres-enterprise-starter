import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Recursively trims string values on incoming DTOs before class-validator
 * runs, so " a@b.com " and accidental leading/trailing whitespace don't slip
 * past @IsEmail()/@IsNotEmpty() or get persisted as-is.
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    return this.trimDeep(value);
  }

  private trimDeep(value: unknown): unknown {
    if (typeof value === 'string') return value.trim();

    if (Array.isArray(value)) {
      return value.map((item: unknown) => this.trimDeep(item));
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        result[key] = this.trimDeep(val);
      }
      return result;
    }

    return value;
  }
}
