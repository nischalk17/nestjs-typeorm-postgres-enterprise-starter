/** Shared, reusable constants (avoid scattering magic strings/numbers). */

export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const DEFAULT_PAGE = 1;
export const DEFAULT_TAKE = 10;
export const MAX_TAKE = 100;

/** Metadata keys used by reflector-based decorators/guards. */
export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Passport strategy names. */
export const JWT_STRATEGY = 'jwt';
export const JWT_REFRESH_STRATEGY = 'jwt-refresh';
