import { Test, TestingModule } from '@nestjs/testing';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product/product.service';

describe('ProductController', () => {
  let controller: ProductController;
  let productService: {
    findAllActive: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    productService = {
      findAllActive: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [{ provide: ProductService, useValue: productService }],
    }).compile();
    controller = module.get<ProductController>(ProductController);
  });

  describe('findAll', () => {
    it('delegates to ProductService.findAllActive', async () => {
      const query = { page: 1, limit: 20 };
      const expected = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
      productService.findAllActive.mockResolvedValue(expected);
      const actualResult = await controller.findAll(query);
      expect(actualResult).toBe(expected);
      expect(productService.findAllActive).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('delegates to ProductService.findOne', async () => {
      productService.findOne.mockResolvedValue({ id: 7 });
      const actualProduct = await controller.findOne(7);
      expect(actualProduct).toEqual({ id: 7 });
      expect(productService.findOne).toHaveBeenCalledWith(7);
    });
  });

  describe('create', () => {
    it('delegates to ProductService.create', async () => {
      const dto = { sku: 'X-1', name: 'Item', isActive: true };
      productService.create.mockResolvedValue({ id: 1 });
      const actualProduct = await controller.create(dto);
      expect(actualProduct).toEqual({ id: 1 });
      expect(productService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('update', () => {
    it('delegates to ProductService.update', async () => {
      const dto = { name: 'Renamed' };
      productService.update.mockResolvedValue({ id: 2, name: 'Renamed' });
      const actualProduct = await controller.update(2, dto);
      expect(actualProduct).toEqual({ id: 2, name: 'Renamed' });
      expect(productService.update).toHaveBeenCalledWith(2, dto);
    });
  });

  describe('remove', () => {
    it('delegates to ProductService.remove and returns deleted flag', async () => {
      productService.remove.mockResolvedValue(undefined);
      const actualResult = await controller.remove(3);
      expect(actualResult).toEqual({ deleted: true });
      expect(productService.remove).toHaveBeenCalledWith(3);
    });
  });
});
