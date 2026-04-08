import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AdminGuard } from './admin.guard';

function createMockContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('returns true when user is ADMIN', () => {
    const ctx = createMockContext({
      userId: 1,
      email: 'a@b.com',
      role: UserRole.ADMIN,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws when user is missing', () => {
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws when user is not ADMIN', () => {
    const ctx = createMockContext({
      userId: 2,
      email: 'u@b.com',
      role: UserRole.USER,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
