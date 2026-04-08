import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/**
 * Request body for PATCH /orders/:id/status — one step forward on the fulfillment
 * chain only (PENDING→PROCESSING→SHIPPED→DELIVERED). Use PATCH /orders/:id/cancel
 * to cancel; do not send CANCELLED here.
 */
export class UpdateStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    description:
      'Next status: exactly one step forward (no skips, no backward). Not CANCELLED — use the cancel endpoint.',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
