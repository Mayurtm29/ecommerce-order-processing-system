import type { PaginationMetaDto } from './dto/pagination-meta.dto';

/**
 * Builds pagination metadata from total row count and the current page window.
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMetaDto {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return { page, limit, total, totalPages };
}
