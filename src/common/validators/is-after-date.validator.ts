import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Cross-field date-range check, e.g. @IsAfterDate('startDate') on `endDate`.
 * Useful for bookings/enrollments/consultancy scheduling where a starter
 * project needs "end must be on/after start". Either side missing passes —
 * combine with @IsNotEmpty()/@IsDefined() on both fields if both are required.
 */
export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (
            value === undefined ||
            value === null ||
            value === '' ||
            relatedValue === undefined ||
            relatedValue === null ||
            relatedValue === ''
          ) {
            return true;
          }

          const currentDate = new Date(value as string | number | Date);
          const relatedDate = new Date(relatedValue as string | number | Date);
          if (
            Number.isNaN(currentDate.getTime()) ||
            Number.isNaN(relatedDate.getTime())
          ) {
            return false;
          }

          return currentDate >= relatedDate;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be on or after ${relatedPropertyName}.`;
        },
      },
    });
  };
}
