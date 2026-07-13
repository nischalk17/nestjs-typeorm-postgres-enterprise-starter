import { Request } from 'express';
import { UserRoleENUM } from '../enums';

export interface AuthenticatedUser {
  id: string;
  fullname?: string;
  email: string;
  role?: UserRoleENUM;
  refreshToken?: string;
}

export interface RequestWithUser extends Request {
  user: AuthenticatedUser;
}
