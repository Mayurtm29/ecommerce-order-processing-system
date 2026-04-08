import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus, UserRole } from '@prisma/client';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

const mockActor: JwtValidatedUser = {
  userId: 7,
  email: 'buyer@example.com',
  role: UserRole.USER,
};

describe('OrderController', () => {
  let controller: OrderController;
  let orderService: {
    findAll: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    updateStatus: jest.Mock;
    cancelOrder: jest.Mock;
  };

  beforeEach(async () => {
    orderService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      cancelOrder: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [{ provide: OrderService, useValue: orderService }],
    }).compile();
    controller = module.get<OrderController>(OrderController);
  });

  describe('findAll', () => {
    it('delegates to OrderService with query and JWT user', async () => {
      const query = { page: 1, limit: 10 };
      const expectedPayload = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
      orderService.findAll.mockResolvedValue(expectedPayload);
      const req = { user: mockActor };
      const actualPayload = await controller.findAll(query, req);
      expect(actualPayload).toBe(expectedPayload);
      expect(orderService.findAll).toHaveBeenCalledWith(query, mockActor);
    });
  });

  describe('findOne', () => {
    it('delegates to OrderService with id and JWT user', async () => {
      orderService.findOne.mockResolvedValue({ id: 3 });
      const req = { user: mockActor };
      const actualOrder = await controller.findOne(3, req);
      expect(actualOrder).toEqual({ id: 3 });
      expect(orderService.findOne).toHaveBeenCalledWith(3, mockActor);
    });
  });

  describe('create', () => {
    it('delegates to OrderService with body and userId from JWT', async () => {
      const dto = { items: [{ productId: 1, quantity: 1 }] };
      orderService.create.mockResolvedValue({ id: 1 });
      const req = { user: mockActor };
      const actualOrder = await controller.create(dto, req);
      expect(actualOrder).toEqual({ id: 1 });
      expect(orderService.create).toHaveBeenCalledWith(dto, mockActor.userId);
    });
  });

  describe('updateStatus', () => {
    it('delegates to OrderService', async () => {
      const dto: { status: OrderStatus } = { status: OrderStatus.SHIPPED };
      orderService.updateStatus.mockResolvedValue({ id: 2 });
      const actualOrder = await controller.updateStatus(2, dto);
      expect(actualOrder).toEqual({ id: 2 });
      expect(orderService.updateStatus).toHaveBeenCalledWith(2, OrderStatus.SHIPPED);
    });
  });

  describe('cancel', () => {
    it('delegates to OrderService with id and JWT user', async () => {
      orderService.cancelOrder.mockResolvedValue({ id: 4 });
      const req = { user: mockActor };
      const actualOrder = await controller.cancel(4, req);
      expect(actualOrder).toEqual({ id: 4 });
      expect(orderService.cancelOrder).toHaveBeenCalledWith(4, mockActor);
    });
  });
});
