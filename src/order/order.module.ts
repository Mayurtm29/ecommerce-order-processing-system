import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order/order.service';
import { OrderStatusSchedulerService } from './services/scheduler/order-status-scheduler.service';

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
