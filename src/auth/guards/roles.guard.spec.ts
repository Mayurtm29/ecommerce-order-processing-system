import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../roles.decorator';
import { RolesGuard } from './roles.guard';

function createMockContext(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  it('allows when no roles metadata', () => {
    jest.mocked(reflector.getAllAndOverride).mockReturnValue(undefined);
    const ctx = createMockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when roles array is empty', () => {
    jest.mocked(reflector.getAllAndOverride).mockReturnValue([]);
    const ctx = createMockContext(undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when user role matches required role', () => {
    jest
      .mocked(reflector.getAllAndOverride)
      .mockImplementation((key: string) =>
        key === ROLES_KEY ? [UserRole.ADMIN] : undefined,
      );
    const ctx = createMockContext({
      userId: 1,
      email: 'a@b.com',
      role: UserRole.ADMIN,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws when user is missing', () => {
    jest
      .mocked(reflector.getAllAndOverride)
      .mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws when user role is not in required roles', () => {
    jest
      .mocked(reflector.getAllAndOverride)
      .mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext({
      userId: 2,
      email: 'u@b.com',
      role: UserRole.USER,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
