import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { JwtValidatedUser } from '../jwt.strategy';
import { ROLES_KEY } from '../roles.decorator';

/**
 * Enforces {@link Roles} metadata when combined with {@link JwtAuthGuard}.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles === undefined || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      user?: JwtValidatedUser;
    }>();
    const user = request.user;
    if (user === undefined || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }
}
