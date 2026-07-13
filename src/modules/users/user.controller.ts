import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser, Roles } from 'src/common/decorators';
import { UserRoleENUM } from 'src/common/enums';
import type { LoggedInUser } from 'src/common/types';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDTO } from './dto/user-filter.dto';
import { UserService } from './user.service';

/** Users allowed to act on any account, not just their own. */
const isPrivileged = (role?: UserRoleENUM): boolean =>
  role === UserRoleENUM.ADMIN || role === UserRoleENUM.SUPER_ADMIN;

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('all')
  @Roles(UserRoleENUM.ADMIN, UserRoleENUM.SUPER_ADMIN)
  @ApiOkResponse({ description: 'Paginated list of users.' })
  async findAll(@Query() filter: UserFilterDTO) {
    return this.usersService.findAll(filter);
  }

  @Get('profile')
  @ApiOkResponse({ description: 'The authenticated user profile.' })
  getProfile(@GetUser() user: LoggedInUser) {
    return this.usersService.getProfile(user);
  }

  @Get(':id')
  @ApiOkResponse({ description: 'The requested user.' })
  @ApiForbiddenResponse({ description: "Cannot access another user's record." })
  @ApiNotFoundResponse({ description: 'User not found.' })
  findById(@Param('id') id: string, @GetUser() user: LoggedInUser) {
    if (!isPrivileged(user.role) && id !== user.id) {
      throw new ForbiddenException('Access denied: cannot view another user');
    }
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'User updated successfully.' })
  @ApiForbiddenResponse({ description: "Cannot modify another user's record." })
  @ApiNotFoundResponse({ description: 'User not found.' })
  update(
    @Param('id') id: string,
    @Body() updateDetails: UpdateUserDto,
    @GetUser() user: LoggedInUser,
  ) {
    if (!isPrivileged(user.role) && id !== user.id) {
      throw new ForbiddenException('Access denied: cannot modify another user');
    }
    return this.usersService.update(id, updateDetails);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoleENUM.ADMIN, UserRoleENUM.SUPER_ADMIN)
  @ApiOkResponse({ description: 'User soft-deleted successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  deleteById(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
