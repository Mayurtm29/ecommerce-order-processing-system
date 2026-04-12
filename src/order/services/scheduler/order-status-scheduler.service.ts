import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';

/**
 * Periodically promotes PENDING orders to PROCESSING.
 */
@Injectable()
export class OrderStatusSchedulerService {
  private readonly logger = new Logger(OrderStatusSchedulerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('*/5 * * * *')
  async promotePendingToProcessing(): Promise<void> {
    const result = await this.prisma.order.updateMany({
      where: { status: OrderStatus.PENDING },
      data: { status: OrderStatus.PROCESSING },
    });
    if (result.count > 0) {
      this.logger.log(
        `Promoted ${result.count} order(s) from PENDING to PROCESSING`,
      );
    }
  }
}
