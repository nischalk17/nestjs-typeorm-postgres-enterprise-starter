import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse } from '@nestjs/swagger';

/**
 * Documents the standard 400 response shape produced by the global
 * ValidationPipe (whitelist/forbidNonWhitelisted/transform) via
 * AllExceptionsFilter's `errors` array. Apply to any endpoint that accepts
 * a `@Body()` DTO.
 */
export const ApiValidationResponse = () =>
  applyDecorators(
    ApiBadRequestResponse({
      description: 'Validation failed.',
      schema: {
        example: {
          success: false,
          statusCode: 400,
          message: 'email must be an email',
          errors: [
            'email must be an email',
            'password must be longer than or equal to 8 characters',
          ],
          path: '/api/v1/auth/register',
          timestamp: '2026-07-13T12:00:00.000Z',
        },
      },
    }),
  );
