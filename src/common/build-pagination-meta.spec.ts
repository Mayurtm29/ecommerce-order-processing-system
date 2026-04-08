import { buildPaginationMeta } from './build-pagination-meta';

describe('buildPaginationMeta', () => {
  it('computes totalPages when limit is positive', () => {
    expect(buildPaginationMeta(1, 20, 45)).toEqual({
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it('returns totalPages 0 when limit is zero', () => {
    expect(buildPaginationMeta(1, 0, 100).totalPages).toBe(0);
  });
});
