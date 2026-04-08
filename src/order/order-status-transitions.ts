import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const NEXT_FULFILLMENT: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.PENDING]: OrderStatus.PROCESSING,
  [OrderStatus.PROCESSING]: OrderStatus.SHIPPED,
  [OrderStatus.SHIPPED]: OrderStatus.DELIVERED,
};

/**
 * Enforces the linear fulfillment chain for admin PATCH /orders/:id/status.
 * Cancellation must use PATCH /orders/:id/cancel.
 */
export function assertValidAdminStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
): void {
  if (targetStatus === OrderStatus.CANCELLED) {
    throw new BadRequestException(
      'Use PATCH /orders/:id/cancel to cancel a pending order; CANCELLED cannot be set via status update',
    );
  }
  if (currentStatus === OrderStatus.CANCELLED) {
    throw new BadRequestException(
      'Cannot change status of a cancelled order',
    );
  }
  if (currentStatus === OrderStatus.DELIVERED) {
    throw new BadRequestException(
      'Cannot change status of a delivered order',
    );
  }
  if (targetStatus === currentStatus) {
    throw new BadRequestException(
      'Order is already in this status; only single-step forward transitions are allowed',
    );
  }
  const allowedNext = NEXT_FULFILLMENT[currentStatus];
  if (allowedNext === undefined) {
    throw new BadRequestException(
      `Invalid current status for fulfillment transition: ${currentStatus}`,
    );
  }
  if (targetStatus !== allowedNext) {
    throw new BadRequestException(
      `Invalid status transition from ${currentStatus} to ${targetStatus}; next allowed status is ${allowedNext}`,
    );
  }
}

