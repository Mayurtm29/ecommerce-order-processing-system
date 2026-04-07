import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { JwtValidatedUser } from '../jwt.strategy';

/**
 * Requires {@link UserRole.ADMIN} on `request.user`.
 * Use only after {@link JwtAuthGuard} so the JWT payload is present.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: JwtValidatedUser;
    }>();
    const user = request.user;
    if (user === undefined || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Requires ADMIN role');
    }
    return true;
  }
}
