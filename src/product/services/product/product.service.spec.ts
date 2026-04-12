import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/services/prisma.service';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let prisma: {
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      product: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get<ProductService>(ProductService);
  });

  describe('findAllActive', () => {
    it('returns paginated active products', async () => {
      prisma.product.count.mockResolvedValue(1);
      prisma.product.findMany.mockResolvedValue([{ id: 1, sku: 'S' }]);
      const query = { page: 1, limit: 20 };
      const actualResult = await service.findAllActive(query);
      expect(actualResult.data).toEqual([{ id: 1, sku: 'S' }]);
      expect(actualResult.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { isActive: true },
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFound when product missing', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns product when found', async () => {
      const product = { id: 1, sku: 'SKU-1' };
      prisma.product.findUnique.mockResolvedValue(product);
      const actualProduct = await service.findOne(1);
      expect(actualProduct).toBe(product);
    });
  });

  describe('create', () => {
    it('creates product with trimmed fields and default isActive', async () => {
      const created = { id: 1, sku: 'SKU-1', name: 'Name' };
      prisma.product.create.mockResolvedValue(created);
      const actualProduct = await service.create({
        sku: '  SKU-1  ',
        name: '  Name  ',
        description: '  Desc  ',
        isActive: true,
      });
      expect(actualProduct).toBe(created);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          sku: 'SKU-1',
          name: 'Name',
          description: 'Desc',
          isActive: true,
        },
      });
    });

    it('defaults isActive true when omitted', async () => {
      prisma.product.create.mockResolvedValue({ id: 2 });
      await service.create({ sku: 'S', name: 'N' });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          sku: 'S',
          name: 'N',
          description: undefined,
          isActive: true,
        },
      });
    });

    it('throws ConflictException on duplicate SKU', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['sku'] },
      });
      prisma.product.create.mockRejectedValue(err);
      await expect(
        service.create({
          sku: 'DUP',
          name: 'N',
          isActive: true,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows non-P2002 errors from create', async () => {
      const err = new Error('db down');
      prisma.product.create.mockRejectedValue(err);
      await expect(
        service.create({ sku: 'S', name: 'N', isActive: true }),
      ).rejects.toThrow('db down');
    });
  });

  describe('update', () => {
    it('throws BadRequest when no fields provided', async () => {
      await expect(service.update(1, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.product.update).not.toHaveBeenCalled();
    });

    it('throws NotFound when Prisma returns P2025', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: 'test',
        meta: undefined,
      });
      prisma.product.update.mockRejectedValue(err);
      await expect(
        service.update(1, { name: 'New' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates with trimmed partial fields', async () => {
      const updated = { id: 1, sku: 'X', name: 'Y' };
      prisma.product.update.mockResolvedValue(updated);
      const actualProduct = await service.update(1, {
        sku: '  X  ',
        name: '  Y  ',
        description: '  Z  ',
        isActive: false,
      });
      expect(actualProduct).toBe(updated);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          sku: 'X',
          name: 'Y',
          description: 'Z',
          isActive: false,
        },
      });
    });

    it('trims description to empty string when update sends whitespace', async () => {
      prisma.product.update.mockResolvedValue({ id: 1 });
      await service.update(1, { description: '   ' });
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { description: '' },
      });
    });

    it('throws ConflictException on duplicate SKU during update', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Unique', {
        code: 'P2002',
        clientVersion: 'test',
        meta: { target: ['sku'] },
      });
      prisma.product.update.mockRejectedValue(err);
      await expect(
        service.update(1, { sku: 'TAKEN' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unknown errors from update', async () => {
      prisma.product.update.mockRejectedValue(new Error('fail'));
      await expect(service.update(1, { name: 'N' })).rejects.toThrow('fail');
    });
  });

  describe('remove', () => {
    it('throws NotFound when delete hits P2025', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('Not found', {
        code: 'P2025',
        clientVersion: 'test',
        meta: undefined,
      });
      prisma.product.delete.mockRejectedValue(err);
      await expect(service.remove(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Conflict when delete hits P2003', async () => {
      const err = new Prisma.PrismaClientKnownRequestError('FK', {
        code: 'P2003',
        clientVersion: 'test',
        meta: undefined,
      });
      prisma.product.delete.mockRejectedValue(err);
      await expect(service.remove(1)).rejects.toBeInstanceOf(ConflictException);
    });

    it('deletes product when Prisma succeeds', async () => {
      prisma.product.delete.mockResolvedValue(undefined);
      await service.remove(7);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });

    it('rethrows unknown errors from delete', async () => {
      prisma.product.delete.mockRejectedValue(new Error('fail'));
      await expect(service.remove(1)).rejects.toThrow('fail');
    });
  });
});
