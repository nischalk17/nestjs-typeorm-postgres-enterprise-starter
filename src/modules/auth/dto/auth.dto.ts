import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PASSWORD_REGEX } from 'src/common/constants';
import { UserRoleENUM } from 'src/common/enums';

/** Normalizes email input for consistent lookups/uniqueness checks. */
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsNotEmpty()
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(100)
  fullname!: string;

  @ApiProperty({ example: 'user@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({ example: UserRoleENUM.USER })
  @IsEnum(UserRoleENUM, { message: 'Valid role required.' })
  role!: UserRoleENUM;
}
