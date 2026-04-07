import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderStatusSchedulerService } from './order-status-scheduler.service';

/**
 * Encapsulates order domain HTTP handlers and Prisma-backed persistence.
 */
@Module({
  imports: [AuthModule],
  controllers: [OrderController],
  providers: [OrderService, OrderStatusSchedulerService],
  exports: [OrderService],
})
export class OrderModule {}
