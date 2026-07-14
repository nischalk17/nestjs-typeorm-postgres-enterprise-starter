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
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiValidationResponse, GetUser, Roles } from 'src/common/decorators';
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

  @ApiOperation({
    summary: 'List users (admin only)',
    description:
      'Paginated, searchable, sortable, optionally filtered by role.',
  })
  @Get('all')
  @Roles(UserRoleENUM.ADMIN, UserRoleENUM.SUPER_ADMIN)
  @ApiOkResponse({ description: 'Paginated list of users.' })
  async findAll(@Query() filter: UserFilterDTO) {
    return this.usersService.findAll(filter);
  }

  @ApiOperation({ summary: "Get the current user's own profile" })
  @Get('profile')
  @ApiOkResponse({ description: 'The authenticated user profile.' })
  getProfile(@GetUser() user: LoggedInUser) {
    return this.usersService.getProfile(user);
  }

  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Self-service only unless the caller is admin/super_admin.',
  })
  @ApiParam({ name: 'id', example: '1' })
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

  @ApiOperation({
    summary: 'Update a user by ID',
    description: 'Self-service only unless the caller is admin/super_admin.',
  })
  @ApiParam({ name: 'id', example: '1' })
  @Patch(':id')
  @ApiOkResponse({ description: 'User updated successfully.' })
  @ApiForbiddenResponse({ description: "Cannot modify another user's record." })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiConflictResponse({ description: 'Email already in use.' })
  @ApiValidationResponse()
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

  @ApiOperation({ summary: 'Soft-delete a user by ID (admin only)' })
  @ApiParam({ name: 'id', example: '1' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRoleENUM.ADMIN, UserRoleENUM.SUPER_ADMIN)
  @ApiOkResponse({ description: 'User soft-deleted successfully.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  deleteById(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
