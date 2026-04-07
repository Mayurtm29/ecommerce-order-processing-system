import { PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';

/**
 * Partial update for catalog products (admin).
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
