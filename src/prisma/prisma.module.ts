import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';

/**
 * Registers Prisma globally so feature modules can inject {@link PrismaService} without re-importing.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
