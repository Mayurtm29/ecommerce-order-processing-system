import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { assertValidAdminStatusTransition } from './order-status-transitions';

describe('assertValidAdminStatusTransition', () => {
  it('allows PENDING to PROCESSING', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.PENDING, OrderStatus.PROCESSING),
    ).not.toThrow();
  });

  it('allows PROCESSING to SHIPPED', () => {
    expect(() =>
      assertValidAdminStatusTransition(
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
      ),
    ).not.toThrow();
  });

  it('allows SHIPPED to DELIVERED', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.SHIPPED, OrderStatus.DELIVERED),
    ).not.toThrow();
  });

  it('rejects CANCELLED target', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED),
    ).toThrow(BadRequestException);
  });

  it('rejects when current is CANCELLED', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.CANCELLED, OrderStatus.PROCESSING),
    ).toThrow(BadRequestException);
  });

  it('rejects when current is DELIVERED', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.DELIVERED, OrderStatus.SHIPPED),
    ).toThrow(BadRequestException);
  });

  it('rejects same status', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.PENDING, OrderStatus.PENDING),
    ).toThrow(BadRequestException);
  });

  it('rejects skip forward', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.PENDING, OrderStatus.SHIPPED),
    ).toThrow(BadRequestException);
  });

  it('rejects backward', () => {
    expect(() =>
      assertValidAdminStatusTransition(OrderStatus.SHIPPED, OrderStatus.PROCESSING),
    ).toThrow(BadRequestException);
  });

  it('rejects unknown current status not in fulfillment map', () => {
    const bogus = 'BOGUS' as unknown as OrderStatus;
    expect(() =>
      assertValidAdminStatusTransition(bogus, OrderStatus.PROCESSING),
    ).toThrow(BadRequestException);
  });
});
