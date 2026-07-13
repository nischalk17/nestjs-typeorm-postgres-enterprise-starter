import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/common/dto';
import { UserRoleENUM } from 'src/common/enums';

export class UserFilterDTO extends PaginationDto {
  @ApiPropertyOptional({ enum: UserRoleENUM })
  @IsOptional()
  @IsEnum(UserRoleENUM, { message: 'Valid role required' })
  role?: UserRoleENUM;
}
