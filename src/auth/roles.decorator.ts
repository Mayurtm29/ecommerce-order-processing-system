import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given {@link UserRole} values (after JWT validation).
 */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(ROLES_KEY, roles);
