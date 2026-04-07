import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Requires a valid JWT from `Authorization: Bearer <token>` (strategy name `jwt`).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
