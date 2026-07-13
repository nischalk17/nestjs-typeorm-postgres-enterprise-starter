import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants';
import { UserRoleENUM } from '../enums';

export const Roles = (...roles: UserRoleENUM[]) =>
  SetMetadata(ROLES_KEY, roles);
