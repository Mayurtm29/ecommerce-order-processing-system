import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type Product } from '@prisma/client';
import { buildPaginationMeta } from '../common/build-pagination-meta';
import type { PaginationMetaDto } from '../common/dto/pagination-meta.dto';
import type { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { resolvePaginationParams } from '../common/resolve-pagination-params';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

/**
 * Catalog CRUD and authenticated reads.
 */
@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(query: PaginationQueryDto): Promise<{
    data: Product[];
    meta: PaginationMetaDto;
  }> {
    const { page, limit, skip } = resolvePaginationParams(query);
    const where = { isActive: true };
    const [total, data] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
    ]);
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (product === null) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(input: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          sku: input.sku.trim(),
          name: input.name.trim(),
          description: input.description?.trim(),
          isActive: input.isActive ?? true,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('A product with this SKU already exists');
      }
      throw err;
    }
  }

  async update(id: number, input: UpdateProductDto) {
    const data = this.buildProductUpdateData(input);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }
    try {
      return await this.prisma.product.update({
        where: { id },
        data,
      });
    } catch (err) {
      throw this.mapProductWriteError(err, 'update');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.product.delete({ where: { id } });
    } catch (err) {
      throw this.mapProductWriteError(err, 'delete');
    }
  }

  private buildProductUpdateData(
    input: UpdateProductDto,
  ): Prisma.ProductUpdateInput {
    const data: Prisma.ProductUpdateInput = {};
    if (input.sku !== undefined) {
      data.sku = input.sku.trim();
    }
    if (input.name !== undefined) {
      data.name = input.name.trim();
    }
    if (input.description !== undefined) {
      data.description = input.description?.trim() ?? null;
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
    }
    return data;
  }

  /**
   * Maps Prisma errors from product update/delete to HTTP exceptions.
   */
  private mapProductWriteError(
    err: unknown,
    operation: 'update' | 'delete',
  ): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new NotFoundException('Product not found');
      }
      if (err.code === 'P2002') {
        throw new ConflictException('A product with this SKU already exists');
      }
      if (operation === 'delete' && err.code === 'P2003') {
        throw new ConflictException(
          'Cannot delete product: it is referenced by order line items',
        );
      }
    }
    throw err;
  }
}
