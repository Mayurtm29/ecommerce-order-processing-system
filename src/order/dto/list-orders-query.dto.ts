import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * Query parameters for GET /orders: optional status filter and pagination.
 */
export class ListOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus, example: OrderStatus.PENDING })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
