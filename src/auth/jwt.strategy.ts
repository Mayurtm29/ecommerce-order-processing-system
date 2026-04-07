import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * Payload shape emitted by {@link AuthService.login} and validated from the Bearer token.
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

/**
 * Value attached to `request.user` after a successful JWT validation.
 */
export interface JwtValidatedUser {
  userId: number;
  email: string;
  role: UserRole;
}

/**
 * Passport JWT strategy: validates `Authorization: Bearer` tokens signed by this API.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    const secret = process.env.JWT_SECRET?.trim();
    if (secret === undefined || secret.length === 0) {
      throw new Error('JWT_SECRET must be set');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Maps the verified JWT payload to the user object on the request.
   */
  validate(payload: JwtPayload): JwtValidatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
