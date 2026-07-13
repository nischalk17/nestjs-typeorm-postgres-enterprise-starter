import { randomUUID } from 'crypto';
import { UserRoleENUM } from 'src/common/enums';
import { User } from 'src/modules/users/entities/user.entity';

export interface UserFactoryOverrides {
  fullname?: string;
  email?: string;
  password?: string;
  role?: UserRoleENUM;
}

/**
 * Lightweight factory producing a plain User object (no heavy faker dependency).
 * Password should be hashed by the caller before persisting.
 */
export const buildUser = (overrides: UserFactoryOverrides = {}): User => {
  const user = new User();
  const unique = randomUUID().slice(0, 8);
  user.fullname = overrides.fullname ?? `Test User ${unique}`;
  user.email = overrides.email ?? `user_${unique}@example.com`;
  user.password = overrides.password ?? 'ChangeMe@123';
  user.role = overrides.role ?? UserRoleENUM.USER;
  return user;
};
