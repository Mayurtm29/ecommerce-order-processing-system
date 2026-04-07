import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/**
 * Request body for PATCH /orders/:id/status — updates only the order status.
 */
export class UpdateStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
