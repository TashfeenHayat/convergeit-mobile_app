/** Backend `PaginationQueryDto` caps `limit` at 100 (even when `all=true`). */
export const API_MAX_PAGE_LIMIT = 100;

/** Use for dropdown/catalog lists — never pair with `limit` above max. */
export const LIST_ALL_QUERY = { all: true as const } as const;

export function clampApiPageLimit(limit?: number): number | undefined {
  if (limit == null || !Number.isFinite(limit)) return undefined;
  return Math.min(Math.max(1, Math.floor(limit)), API_MAX_PAGE_LIMIT);
}

type PaginationFields = {
  page?: number;
  limit?: number;
  all?: boolean;
};

/** Strip `page`/`limit` when `all=true`; otherwise cap `limit` to API max. */
export function sanitizePaginationQueryParams<T extends PaginationFields>(
  params?: T,
): T | undefined {
  if (!params) return params;
  const out = { ...params };
  if (out.all === true) {
    delete out.page;
    delete out.limit;
    return out;
  }
  if (out.limit != null) {
    const capped = clampApiPageLimit(out.limit);
    if (capped != null) out.limit = capped;
    else delete out.limit;
  }
  return out;
}
