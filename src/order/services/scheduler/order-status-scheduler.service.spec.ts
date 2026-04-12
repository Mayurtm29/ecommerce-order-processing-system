import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { OrderStatusSchedulerService } from './order-status-scheduler.service';

describe('OrderStatusSchedulerService', () => {
  let service: OrderStatusSchedulerService;
  let prisma: { order: { updateMany: jest.Mock } };

  beforeEach(async () => {
    prisma = { order: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderStatusSchedulerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<OrderStatusSchedulerService>(
      OrderStatusSchedulerService,
    );
  });

  describe('promotePendingToProcessing', () => {
    it('updates PENDING orders to PROCESSING', async () => {
      prisma.order.updateMany.mockResolvedValue({ count: 2 });
      await service.promotePendingToProcessing();
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { status: OrderStatus.PENDING },
        data: { status: OrderStatus.PROCESSING },
      });
    });
  });
});
