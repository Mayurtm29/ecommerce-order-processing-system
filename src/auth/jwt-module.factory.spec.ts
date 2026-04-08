import { createJwtModuleOptions } from './jwt-module.factory';

describe('createJwtModuleOptions', () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpires = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
    process.env.JWT_EXPIRES_IN = originalExpires;
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;
    expect(() => createJwtModuleOptions()).toThrow('JWT_SECRET must be set');
  });

  it('returns secret and default expiresIn 1d', () => {
    process.env.JWT_SECRET = 'factory-secret';
    delete process.env.JWT_EXPIRES_IN;
    const actualOptions = createJwtModuleOptions();
    expect(actualOptions.secret).toBe('factory-secret');
    expect(actualOptions.signOptions?.expiresIn).toBe('1d');
  });

  it('uses JWT_EXPIRES_IN when set', () => {
    process.env.JWT_SECRET = 'factory-secret';
    process.env.JWT_EXPIRES_IN = '12h';
    const actualOptions = createJwtModuleOptions();
    expect(actualOptions.signOptions?.expiresIn).toBe('12h');
  });
});
