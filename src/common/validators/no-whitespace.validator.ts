import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Rejects strings containing ANY whitespace (leading, trailing, or internal).
 * Use for fields that must never contain spaces — usernames, slugs, tokens,
 * coupon codes. For fields that just shouldn't be blank, use @IsNotBlank()
 * instead (that one still allows internal spaces, e.g. full names).
 */
export function NoWhitespace(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noWhitespace',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') return true;
          return !/\s/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must not contain whitespace.`;
        },
      },
    });
  };
}
