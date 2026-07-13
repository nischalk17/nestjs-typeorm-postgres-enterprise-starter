import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

/**
 * Rejects dates after today (time-of-day ignored). Empty/undefined values pass —
 * pair with @IsNotEmpty()/@IsDefined() if the field is required.
 */
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null || value === '') {
            return true;
          }

          const inputDate = new Date(value as string | number | Date);
          if (Number.isNaN(inputDate.getTime())) return false;

          const today = new Date();
          inputDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);

          return inputDate <= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot be a future date.`;
        },
      },
    });
  };
}
