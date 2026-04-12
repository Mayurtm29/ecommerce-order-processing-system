import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, UserRole } from '@prisma/client';
import type { JwtValidatedUser } from '../../../auth/jwt.strategy';
import { buildPaginationMeta } from '../../../common/build-pagination-meta';
import type { PaginationMetaDto } from '../../../common/dto/pagination-meta.dto';
import { resolvePaginationParams } from '../../../common/resolve-pagination-params';
import { PrismaService } from '../../../prisma/services/prisma.service';
import type { CreateOrderDto } from '../../dto/create-order.dto';
import type { ListOrdersQueryDto } from '../../dto/list-orders-query.dto';
import { assertValidAdminStatusTransition } from '../../order-status-transitions';

const orderIncludeWithItemsAndProduct = {
  items: { include: { product: true } },
} as const;

type OrderWithItems = Prisma.OrderGetPayload<{
  include: typeof orderIncludeWithItemsAndProduct;
}>;

/**
 * Persists and queries orders and line items via Prisma.
 */
@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListOrdersQueryDto,
    actor: JwtValidatedUser,
  ): Promise<{
    data: OrderWithItems[];
    meta: PaginationMetaDto;
  }> {
    const { page, limit, skip } = resolvePaginationParams(query);
    const where: Prisma.OrderWhereInput = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(actor.role !== UserRole.ADMIN ? { userId: actor.userId } : {}),
    };
    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: orderIncludeWithItemsAndProduct,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findOne(id: number, actor: JwtValidatedUser): Promise<OrderWithItems> {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(actor.role !== UserRole.ADMIN ? { userId: actor.userId } : {}),
      },
      include: orderIncludeWithItemsAndProduct,
    });
    if (order === null) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async create(
    input: CreateOrderDto,
    userId: number,
  ): Promise<OrderWithItems> {
    await this.assertAllItemsReferenceActiveProducts(input);
    const data: Prisma.OrderCreateInput = {
      status: OrderStatus.PENDING,
      user: { connect: { id: userId } },
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    };
    return this.prisma.order.create({
      data,
      include: orderIncludeWithItemsAndProduct,
    });
  }

  async updateStatus(id: number, status: OrderStatus): Promise<OrderWithItems> {
    const existing = await this.prisma.order.findUnique({
      where: { id },
    });
    if (existing === null) {
      throw new NotFoundException('Order not found');
    }
    assertValidAdminStatusTransition(existing.status, status);
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: orderIncludeWithItemsAndProduct,
    });
  }

  async cancelOrder(
    id: number,
    actor: JwtValidatedUser,
  ): Promise<OrderWithItems> {
    const existing = await this.prisma.order.findUnique({
      where: { id },
    });
    if (existing === null) {
      throw new NotFoundException('Order not found');
    }
    if (
      actor.role !== UserRole.ADMIN &&
      existing.userId !== actor.userId
    ) {
      throw new ForbiddenException('You can only cancel your own orders');
    }
    if (existing.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Only orders in PENDING status can be cancelled',
      );
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: orderIncludeWithItemsAndProduct,
    });
  }

  private async assertAllItemsReferenceActiveProducts(
    input: CreateOrderDto,
  ): Promise<void> {
    const uniqueIds = [...new Set(input.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: uniqueIds }, isActive: true },
      select: { id: true },
    });
    if (products.length !== uniqueIds.length) {
      const found = new Set(products.map((p) => p.id));
      const missing = uniqueIds.filter((id) => !found.has(id));
      throw new BadRequestException(
        `Unknown or inactive product id: ${missing.join(', ')}`,
      );
    }
  }
}
