const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Normalizes optional page/limit query params for Prisma `skip` / `take`.
 */
export function resolvePaginationParams(query: {
  page?: number;
  limit?: number;
}): { page: number; limit: number; skip: number } {
  const page = query.page ?? DEFAULT_PAGE;
  const limit = query.limit ?? DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}
