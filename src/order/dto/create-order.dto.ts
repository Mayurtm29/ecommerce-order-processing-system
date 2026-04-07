import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

/**
 * Request body for POST /orders: one or more line items; status defaults to PENDING in the service.
 */
export class CreateOrderDto {
  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'At least one line item (no price fields)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
