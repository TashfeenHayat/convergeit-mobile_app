/** Server-side list filter for `GET /hrms/shifts` (camelCase query keys only). */
export const HRMS_SHIFTS_LIST_SEARCH_MAX = 80;

/** `GET /hrms/shifts?shiftScope=` — `internal` | `external` | `all` (explicit); omitted keys use server defaults. */
export type HrmsShiftsListShiftScope = "internal" | "external" | "all";

export type HrmsShiftsListQueryInput = {
  page?: number;
  limit?: number;
  /** When true, server disables paging (dropdowns). */
  all?: boolean;
  /** Shift name; server applies case-insensitive partial match (max length enforced here). */
  search?: string;
  /** Optional UUID; tenant scope for same reseller (wide vs own company is server/JWT rules). */
  parentCompanyId?: string;
  /**
   * `internal` = platform catalog only; `external` = tenant-owned only; `all` = both within actor scope.
   */
  shiftScope?: HrmsShiftsListShiftScope;
};

/**
 * Builds the exact query object sent to `GET /hrms/shifts`: camelCase keys, trimmed IDs, search clamped to API max.
 */
export function buildHrmsShiftsListQueryRecord(
  input: HrmsShiftsListQueryInput | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!input) return undefined;
  const out: Record<string, string | number | boolean> = {};
  if (input.page != null && Number.isFinite(input.page)) out.page = input.page;
  if (input.limit != null && Number.isFinite(input.limit)) out.limit = input.limit;
  if (input.all === true) out.all = true;
  const parent = input.parentCompanyId?.trim();
  if (parent) out.parentCompanyId = parent;
  const q = input.search?.trim() ?? "";
  if (q) out.search = q.slice(0, HRMS_SHIFTS_LIST_SEARCH_MAX);
  if (input.shiftScope === "internal" || input.shiftScope === "external" || input.shiftScope === "all") {
    out.shiftScope = input.shiftScope;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** After create, align list filter so the new row is visible without a manual refresh. */
export function listCatalogFilterAfterShiftCreate(
  createdScope: "platform" | "tenant",
  current: "all" | "internal" | "external",
): "all" | "internal" | "external" {
  if (current === "all") return current;
  if (createdScope === "platform" && current === "external") return "internal";
  if (createdScope === "tenant" && current === "internal") return "external";
  return current;
}
