import { API_MAX_PAGE_LIMIT, clampApiPageLimit } from "@/lib/constants/pagination";
import type { WebsiteAssignmentsWebsitesParams } from "./hooks";

/** Build `/website-assignments/websites` query — omits `resellerId` when session is tenant-scoped. */
export function buildWebsitesInScopeParams(input: {
  canFilterByResellerId: boolean;
  all?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  assigned?: boolean;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  userId?: string;
  serviceSchedulingConfigured?: boolean;
  serviceHoursConfigured?: boolean;
  visitorTopicsConfigured?: boolean;
  fullyAssigned?: boolean;
}): WebsiteAssignmentsWebsitesParams {
  const params: WebsiteAssignmentsWebsitesParams = {};
  if (input.all) {
    params.all = true;
  } else {
    if (input.page != null) params.page = input.page;
    const capped = clampApiPageLimit(input.limit);
    if (capped != null) params.limit = capped;
    else if (input.limit != null) params.limit = API_MAX_PAGE_LIMIT;
  }
  const q = input.search?.trim();
  if (q) params.search = q;
  if (input.assigned !== undefined) params.assigned = input.assigned;
  if (input.canFilterByResellerId && input.resellerId?.trim()) {
    params.resellerId = input.resellerId.trim();
  }
  if (input.parentCompanyId?.trim()) params.parentCompanyId = input.parentCompanyId.trim();
  if (input.childCompanyId?.trim()) params.childCompanyId = input.childCompanyId.trim();
  const uid = input.userId?.trim();
  if (uid) params.userId = uid;
  if (input.serviceSchedulingConfigured !== undefined) {
    params.serviceSchedulingConfigured = input.serviceSchedulingConfigured;
  }
  if (input.serviceHoursConfigured !== undefined) {
    params.serviceHoursConfigured = input.serviceHoursConfigured;
  }
  if (input.visitorTopicsConfigured !== undefined) {
    params.visitorTopicsConfigured = input.visitorTopicsConfigured;
  }
  if (input.fullyAssigned !== undefined) {
    params.fullyAssigned = input.fullyAssigned;
  }
  return params;
}
