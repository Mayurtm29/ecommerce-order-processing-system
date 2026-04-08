import { UserRole } from '@prisma/client';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => new JwtStrategy()).toThrow('JWT_SECRET must be set');
  });

  it('throws when JWT_SECRET is blank', () => {
    process.env.JWT_SECRET = '   ';
    expect(() => new JwtStrategy()).toThrow('JWT_SECRET must be set');
  });

  it('validate maps JWT payload to JwtValidatedUser', () => {
    process.env.JWT_SECRET = 'unit-test-secret';
    const strategy = new JwtStrategy();
    const actualUser = strategy.validate({
      sub: 42,
      email: 'u@example.com',
      role: UserRole.ADMIN,
    });
    expect(actualUser).toEqual({
      userId: 42,
      email: 'u@example.com',
      role: UserRole.ADMIN,
    });
  });
});
