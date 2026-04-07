/**
 * Ensures e2e runs have secrets and DB URL before AppModule boots.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'e2e-jwt-secret-must-be-long-enough-for-tests';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'file:./dev.db';
process.env.THROTTLE_ENABLED = process.env.THROTTLE_ENABLED ?? 'false';
