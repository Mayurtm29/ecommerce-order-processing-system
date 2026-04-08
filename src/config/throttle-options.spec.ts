import type { ExecutionContext } from '@nestjs/common';
import { getThrottlerModuleOptions } from './throttle-options';

describe('throttle-options', () => {
  const saved = {
    THROTTLE_ENABLED: process.env.THROTTLE_ENABLED,
    THROTTLE_TTL_MS: process.env.THROTTLE_TTL_MS,
    THROTTLE_LIMIT: process.env.THROTTLE_LIMIT,
    THROTTLE_AUTH_TTL_MS: process.env.THROTTLE_AUTH_TTL_MS,
    THROTTLE_AUTH_LIMIT: process.env.THROTTLE_AUTH_LIMIT,
  };

  afterEach(() => {
    process.env.THROTTLE_ENABLED = saved.THROTTLE_ENABLED;
    process.env.THROTTLE_TTL_MS = saved.THROTTLE_TTL_MS;
    process.env.THROTTLE_LIMIT = saved.THROTTLE_LIMIT;
    process.env.THROTTLE_AUTH_TTL_MS = saved.THROTTLE_AUTH_TTL_MS;
    process.env.THROTTLE_AUTH_LIMIT = saved.THROTTLE_AUTH_LIMIT;
  });

  describe('getThrottlerModuleOptions', () => {
    it('uses defaults when env vars unset', () => {
      delete process.env.THROTTLE_TTL_MS;
      delete process.env.THROTTLE_LIMIT;
      delete process.env.THROTTLE_ENABLED;
      const opts = getThrottlerModuleOptions();
      expect(opts.throttlers[0].ttl).toBe(60_000);
      expect(opts.throttlers[0].limit).toBe(100);
      expect(opts.skipIf).toBeUndefined();
    });

    it('adds skipIf when THROTTLE_ENABLED is false', () => {
      process.env.THROTTLE_ENABLED = 'false';
      const opts = getThrottlerModuleOptions();
      expect(opts.skipIf).toBeDefined();
      const ctx = {} as ExecutionContext;
      expect(opts.skipIf?.(ctx)).toBe(true);
    });

    it('parses custom ttl and limit', () => {
      process.env.THROTTLE_TTL_MS = '30000';
      process.env.THROTTLE_LIMIT = '50';
      delete process.env.THROTTLE_ENABLED;
      const opts = getThrottlerModuleOptions();
      expect(opts.throttlers[0].ttl).toBe(30_000);
      expect(opts.throttlers[0].limit).toBe(50);
    });

    it('falls back on invalid numeric env', () => {
      process.env.THROTTLE_TTL_MS = 'not-a-number';
      process.env.THROTTLE_LIMIT = '0';
      delete process.env.THROTTLE_ENABLED;
      const opts = getThrottlerModuleOptions();
      expect(opts.throttlers[0].ttl).toBe(60_000);
      expect(opts.throttlers[0].limit).toBe(100);
    });
  });

  it('authRouteThrottle reads THROTTLE_AUTH env when module loads in isolation', () => {
    process.env.THROTTLE_AUTH_TTL_MS = '120000';
    process.env.THROTTLE_AUTH_LIMIT = '5';
    jest.isolateModules(() => {
      const { authRouteThrottle: fresh } = require('./throttle-options') as {
        authRouteThrottle: { ttl: number; limit: number };
      };
      expect(fresh.ttl).toBe(120_000);
      expect(fresh.limit).toBe(5);
    });
  });
});
