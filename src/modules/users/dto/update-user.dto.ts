import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRoleENUM } from 'src/common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Full Name' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(100)
  fullname?: string;

  @ApiPropertyOptional({ example: 'example@gmail.com' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: UserRoleENUM.USER })
  @IsOptional()
  @IsEnum(UserRoleENUM, { message: 'Valid role required.' })
  role?: UserRoleENUM;
}
