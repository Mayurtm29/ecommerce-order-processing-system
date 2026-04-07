import type { JwtModuleOptions } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';

/**
 * Builds {@link JwtModule} options from `JWT_SECRET` and optional `JWT_EXPIRES_IN`.
 */
export function createJwtModuleOptions(): JwtModuleOptions {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret === undefined || secret.length === 0) {
    throw new Error('JWT_SECRET must be set');
  }
  const expiresIn = (process.env.JWT_EXPIRES_IN?.trim() ??
    '1d') as SignOptions['expiresIn'];
  return {
    secret,
    signOptions: { expiresIn },
  };
}
