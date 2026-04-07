import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * Admin create payload for catalog products.
 */
export class CreateProductDto {
  @ApiProperty({ example: 'SKU-1001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  sku: string;

  @ApiProperty({ example: 'Widget' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  name: string;

  @ApiPropertyOptional({ example: 'Optional description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
