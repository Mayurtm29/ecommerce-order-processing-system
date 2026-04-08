import { resolvePaginationParams } from './resolve-pagination-params';

describe('resolvePaginationParams', () => {
  it('applies defaults when page and limit omitted', () => {
    expect(resolvePaginationParams({})).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  it('computes skip from page and limit', () => {
    expect(resolvePaginationParams({ page: 3, limit: 10 })).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });
});
