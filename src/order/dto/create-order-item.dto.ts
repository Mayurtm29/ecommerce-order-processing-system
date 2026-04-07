import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/** Upper bound per line item quantity (abuse prevention). */
const MAX_ORDER_ITEM_QUANTITY = 1_000_000;

/**
 * Line item payload for creating an order (no price fields).
 */
export class CreateOrderItemDto {
  @ApiProperty({
    example: 1,
    type: Number,
    description: 'Database id of an existing active product',
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  productId: number;

  @ApiProperty({
    example: 2,
    minimum: 1,
    maximum: MAX_ORDER_ITEM_QUANTITY,
    description: 'Quantity (integer)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_ORDER_ITEM_QUANTITY)
  @Type(() => Number)
  quantity: number;
}
