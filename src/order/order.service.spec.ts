import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, UserRole } from '@prisma/client';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from './order.service';

const mockAdmin: JwtValidatedUser = {
  userId: 1,
  email: 'admin@example.com',
  role: UserRole.ADMIN,
};

const mockUser: JwtValidatedUser = {
  userId: 2,
  email: 'user@example.com',
  role: UserRole.USER,
};

describe('OrderService', () => {
  let service: OrderService;
  let prisma: {
    order: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    product: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      order: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      product: { findMany: jest.fn() },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
  });

  describe('findAll', () => {
    it('scopes list to actor userId when role is USER', async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);
      const query = { page: 1, limit: 20 };
      await service.findAll(query, mockUser);
      const expectedWhere = { userId: mockUser.userId };
      expect(prisma.order.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expectedWhere,
        }),
      );
    });

    it('does not scope by userId when role is ADMIN', async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);
      const query = { page: 1, limit: 20 };
      await service.findAll(query, mockAdmin);
      expect(prisma.order.count).toHaveBeenCalledWith({ where: {} });
    });

    it('merges status filter with user scope', async () => {
      prisma.order.count.mockResolvedValue(0);
      prisma.order.findMany.mockResolvedValue([]);
      await service.findAll(
        { page: 1, limit: 20, status: OrderStatus.PENDING },
        mockUser,
      );
      expect(prisma.order.count).toHaveBeenCalledWith({
        where: { status: OrderStatus.PENDING, userId: mockUser.userId },
      });
    });
  });

  describe('findOne', () => {
    it('returns order when USER owns it', async () => {
      const orderRow = { id: 10, userId: mockUser.userId };
      prisma.order.findFirst.mockResolvedValue(orderRow);
      const actualOrder = await service.findOne(10, mockUser);
      expect(actualOrder).toBe(orderRow);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 10, userId: mockUser.userId },
        include: expect.any(Object),
      });
    });

    it('throws NotFound when order missing or not owned', async () => {
      prisma.order.findFirst.mockResolvedValue(null);
      await expect(service.findOne(99, mockUser)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('allows ADMIN to load any order by id', async () => {
      const orderRow = { id: 5, userId: 999 };
      prisma.order.findFirst.mockResolvedValue(orderRow);
      await service.findOne(5, mockAdmin);
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: { id: 5 },
        include: expect.any(Object),
      });
    });
  });

  describe('create', () => {
    it('creates order connected to userId with line items', async () => {
      prisma.product.findMany.mockResolvedValue([{ id: 1 }]);
      const created = { id: 1, userId: mockUser.userId };
      prisma.order.create.mockResolvedValue(created);
      const input = {
        items: [{ productId: 1, quantity: 2 }],
      };
      const actualOrder = await service.create(input, mockUser.userId);
      expect(actualOrder).toBe(created);
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          status: OrderStatus.PENDING,
          user: { connect: { id: mockUser.userId } },
          items: {
            create: [{ productId: 1, quantity: 2 }],
          },
        },
        include: expect.any(Object),
      });
    });

    it('throws when product ids are missing or inactive', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      const input = { items: [{ productId: 42, quantity: 1 }] };
      await expect(service.create(input, mockUser.userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('throws NotFound when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(
        service.updateStatus(1, OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when order is already CANCELLED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.CANCELLED,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates status when valid one-step transition', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.PENDING,
        userId: 1,
      });
      const updated = { id: 1, status: OrderStatus.PROCESSING };
      prisma.order.update.mockResolvedValue(updated);
      const actualOrder = await service.updateStatus(1, OrderStatus.PROCESSING);
      expect(actualOrder).toBe(updated);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: OrderStatus.PROCESSING },
        include: expect.any(Object),
      });
    });

    it('throws when skipping a state (PENDING to SHIPPED)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.PENDING,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('throws on backward transition (PROCESSING to PENDING)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.PROCESSING,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.PENDING),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('throws when order is DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.DELIVERED,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('rejects CANCELLED in status body (use cancel endpoint)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.PENDING,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.CANCELLED),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('throws when target equals current status', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        status: OrderStatus.SHIPPED,
        userId: 1,
      });
      await expect(
        service.updateStatus(1, OrderStatus.SHIPPED),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('throws NotFound when order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.cancelOrder(1, mockUser)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Forbidden when USER tries to cancel another user order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 99,
        status: OrderStatus.PENDING,
      });
      await expect(service.cancelOrder(1, mockUser)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('allows USER to cancel own PENDING order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: mockUser.userId,
        status: OrderStatus.PENDING,
      });
      const cancelled = { id: 1, status: OrderStatus.CANCELLED };
      prisma.order.update.mockResolvedValue(cancelled);
      const actualOrder = await service.cancelOrder(1, mockUser);
      expect(actualOrder).toBe(cancelled);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: OrderStatus.CANCELLED },
        include: expect.any(Object),
      });
    });

    it('allows ADMIN to cancel another user PENDING order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: 99,
        status: OrderStatus.PENDING,
      });
      prisma.order.update.mockResolvedValue({ id: 1 });
      await service.cancelOrder(1, mockAdmin);
      expect(prisma.order.update).toHaveBeenCalled();
    });

    it('throws BadRequest when order is not PENDING', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 1,
        userId: mockUser.userId,
        status: OrderStatus.PROCESSING,
      });
      await expect(service.cancelOrder(1, mockUser)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });
});
