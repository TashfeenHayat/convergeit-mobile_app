import type { ChatScopeFilterState } from "../types";

export function hasActiveChatScopeFilters(filters: ChatScopeFilterState): boolean {
  return Boolean(
    filters.resellerId.trim() ||
      filters.parentCompanyId.trim() ||
      filters.childCompanyId.trim() ||
      filters.websiteId.trim() ||
      filters.departmentId.trim() ||
      filters.poolId.trim() ||
      filters.status.trim() ||
      filters.dateFrom.trim() ||
      filters.dateTo.trim(),
  );
}
