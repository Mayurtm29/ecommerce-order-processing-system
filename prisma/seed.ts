import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DEFAULT_BCRYPT_SALT_ROUNDS = 12;

/**
 * Same rules as app sign-up: `BCRYPT_SALT_ROUNDS` (4–31) or default 12.
 */
function readBcryptSaltRoundsForSeed(): number {
  const raw = process.env.BCRYPT_SALT_ROUNDS?.trim();
  if (raw === undefined || raw.length === 0) {
    return DEFAULT_BCRYPT_SALT_ROUNDS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 4 || parsed > 31) {
    throw new Error('BCRYPT_SALT_ROUNDS must be an integer between 4 and 31');
  }
  return parsed;
}

/** Dev-only password documented in README; change for real deployments. */
const SEED_ADMIN_PASSWORD = 'admin-secret-change-me';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (url === undefined || url.length === 0) {
    throw new Error('DATABASE_URL must be set');
  }
  const adapter = new PrismaBetterSqlite3({ url });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(
    SEED_ADMIN_PASSWORD,
    readBcryptSaltRoundsForSeed(),
  );
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'Admin',
      passwordHash,
      role: UserRole.ADMIN,
    },
    create: {
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  const catalog = [
    {
      "sku": "ELEC-001",
      "name": "Wireless Mouse",
      "description": "Ergonomic wireless mouse with USB receiver"
    },
    {
      "sku": "ELEC-002",
      "name": "Mechanical Keyboard",
      "description": "RGB backlit mechanical keyboard with blue switches"
    },{
      "sku": "ELEC-003",
      "name": "Bluetooth Headphones",
      "description": "Noise-cancelling over-ear Bluetooth headphones"
    },{
      "sku": "ELEC-003",
      "name": "Bluetooth Headphones",
      "description": "Noise-cancelling over-ear Bluetooth headphones"
    },{
      "sku": "ELEC-003",
      "name": "Bluetooth Headphones",
      "description": "Noise-cancelling over-ear Bluetooth headphones"
    }
    
  ];
  for (const row of catalog) {
    await prisma.product.upsert({
      where: { sku: row.sku },
      update: {
        name: row.name,
        description: row.description,
        isActive: true,
      },
      create: {
        sku: row.sku,
        name: row.name,
        description: row.description,
        isActive: true,
      },
    });
  }
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
