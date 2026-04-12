import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const originalUrl = process.env.DATABASE_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalUrl;
  });

  it('throws when DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => new PrismaService()).toThrow('DATABASE_URL must be set');
  });

  it('connects on onModuleInit and disconnects on onModuleDestroy', async () => {
    process.env.DATABASE_URL = 'file:./dev.db';
    const service = new PrismaService();
    await service.onModuleInit();
    await service.onModuleDestroy();
  });
});
