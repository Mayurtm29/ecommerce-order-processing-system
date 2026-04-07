import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;

/**
 * Shared `page` / `limit` query for list endpoints.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    example: 1,
    minimum: 1,
    description: 'Page number (default 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: DEFAULT_PAGE_SIZE,
    minimum: 1,
    maximum: MAX_PAGE_SIZE,
    description: `Page size (default ${DEFAULT_PAGE_SIZE}, max ${MAX_PAGE_SIZE})`,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number;
}
