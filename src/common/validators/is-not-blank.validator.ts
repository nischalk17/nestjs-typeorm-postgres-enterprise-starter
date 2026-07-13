import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Rejects strings that are empty or whitespace-only (e.g. "   "), which
 * @IsNotEmpty() alone does not catch. Non-string values pass through
 * untouched — combine with @IsString().
 */
export function IsNotBlank(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotBlank',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;
          return value.trim().length > 0;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot be empty or whitespace only.`;
        },
      },
    });
  };
}
