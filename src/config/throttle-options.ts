import 'dotenv/config';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Reads throttle env vars once at process startup (after dotenv).
 * Used by {@link ThrottlerModule} and {@link AuthController} decorators.
 */
function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim().length === 0) {
    return fallback;
  }
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
}

export function getThrottlerModuleOptions(): {
  throttlers: Array<{ name?: string; ttl: number; limit: number }>;
  skipIf?: (context: ExecutionContext) => boolean;
} {
  const disabled = process.env.THROTTLE_ENABLED?.trim() === 'false';
  const ttl = parsePositiveInt(process.env.THROTTLE_TTL_MS, 60_000);
  const limit = parsePositiveInt(process.env.THROTTLE_LIMIT, 100);
  return {
    throttlers: [{ ttl, limit }],
    ...(disabled ? { skipIf: () => true } : {}),
  };
}

/**
 * Stricter limits for public auth routes (login / sign-up).
 */
export const authRouteThrottle = {
  ttl: parsePositiveInt(process.env.THROTTLE_AUTH_TTL_MS, 60_000),
  limit: parsePositiveInt(process.env.THROTTLE_AUTH_LIMIT, 10),
} as const;
