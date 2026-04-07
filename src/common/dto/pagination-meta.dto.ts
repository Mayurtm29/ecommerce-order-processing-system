import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination metadata for list endpoints that return `{ data, meta }`.
 */
export class PaginationMetaDto {
  @ApiProperty({ example: 1, minimum: 1 })
  page: number;

  @ApiProperty({ example: 20, minimum: 1 })
  limit: number;

  @ApiProperty({ example: 42, minimum: 0 })
  total: number;

  @ApiProperty({ example: 3, minimum: 0 })
  totalPages: number;
}
