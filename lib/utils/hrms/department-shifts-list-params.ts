import { HRMS_SHIFTS_LIST_SEARCH_MAX, type HrmsShiftsListShiftScope } from "./shifts-list-params";

/** Server-side list filter for `GET /hrms/department-shifts` (camelCase query keys only). */
export type HrmsDepartmentShiftsListQueryInput = {
  page?: number;
  limit?: number;
  all?: boolean;
  departmentId?: string;
  parentCompanyId?: string;
  search?: string;
  /** Filters by linked shift template ownership; `all` = both slices within scope. */
  shiftScope?: HrmsShiftsListShiftScope;
};

/**
 * Builds the query object for `GET /hrms/department-shifts`: camelCase keys, trimmed UUIDs,
 * search clamped to the same max as shift catalog search.
 */
export function buildHrmsDepartmentShiftsListQueryRecord(
  input: HrmsDepartmentShiftsListQueryInput | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!input) return undefined;
  const out: Record<string, string | number | boolean> = {};
  if (input.page != null && Number.isFinite(input.page)) out.page = input.page;
  if (input.limit != null && Number.isFinite(input.limit)) out.limit = input.limit;
  if (input.all === true) out.all = true;
  const dept = input.departmentId?.trim();
  if (dept) out.departmentId = dept;
  const parent = input.parentCompanyId?.trim();
  if (parent) out.parentCompanyId = parent;
  const q = input.search?.trim() ?? "";
  if (q) out.search = q.slice(0, HRMS_SHIFTS_LIST_SEARCH_MAX);
  if (input.shiftScope === "internal" || input.shiftScope === "external" || input.shiftScope === "all") {
    out.shiftScope = input.shiftScope;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
