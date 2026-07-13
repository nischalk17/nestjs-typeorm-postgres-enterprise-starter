import {
  ApiProperty,
  ApiPropertyOptional,
  IntersectionType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class EmailDTO {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;
}

export class TitleDTO {
  @ApiProperty({ default: 'Title Of The Entity', maxLength: 255 })
  @IsString()
  @Length(2, 255)
  title!: string;
}

export class DescriptionDTO {
  @ApiPropertyOptional({ default: 'Detailed description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class TitleDescriptionDTO extends IntersectionType(
  TitleDTO,
  DescriptionDTO,
) {}

export class IdDTO {
  @ApiProperty({ example: '1', description: 'Positive Numeric ID' })
  @IsNumberString()
  id!: string;
}

export class OptionalIdDTO {
  @ApiPropertyOptional({ example: '1', description: 'Positive Numeric ID' })
  @IsOptional()
  id?: string;
}

export class StatusDTO {
  @ApiProperty({ type: Boolean, default: true, description: 'true for active' })
  @Type(() => Boolean)
  @IsBoolean()
  status!: boolean;
}

export class SlugDTO {
  @ApiProperty({ example: 'my-unique-slug' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(520)
  slug!: string;
}

export class CategoryIdDTO {
  @ApiProperty()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  categoryId!: number;
}

export class SlugSEODTO extends PartialType(SlugDTO) {
  @ApiPropertyOptional({ maxLength: 600, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  metaTitle?: string;

  @ApiPropertyOptional({ maxLength: 600, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  metaKeywords?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  metaDescription?: string;
}
