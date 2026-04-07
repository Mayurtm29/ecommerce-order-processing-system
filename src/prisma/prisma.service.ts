import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';

/**
 * NestJS lifecycle-managed Prisma client for dependency injection.
 * Uses the better-sqlite3 driver adapter (Prisma ORM 7).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
      throw new Error('DATABASE_URL must be set');
    }
    const adapter = new PrismaBetterSqlite3({ url });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
