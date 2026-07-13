import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Domain-meaningful exceptions. Services should throw these instead of raw
 * HttpException so intent is explicit and error handling stays consistent.
 */
export class BusinessException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateResourceException extends HttpException {
  constructor(resource = 'Resource') {
    super(`${resource} already exists`, HttpStatus.CONFLICT);
  }
}
