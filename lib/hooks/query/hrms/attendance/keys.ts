export type AttendanceQueryParams = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  all?: boolean;
};

/** Stable query-key fragment — strips empty/undefined fields. */
export function normalizeAttendanceQueryParams(
  params?: AttendanceQueryParams,
): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  const from = params.from?.trim();
  const to = params.to?.trim();
  if (from) out.from = from;
  if (to) out.to = to;
  if (params.page != null && Number.isFinite(params.page)) out.page = params.page;
  if (params.limit != null && Number.isFinite(params.limit)) out.limit = params.limit;
  if (params.all === true) out.all = true;
  return Object.keys(out).length > 0 ? out : undefined;
}

export function isAttendanceMeTodaySnapshotKey(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length < 4) return false;
  if (queryKey[0] !== "hrms" || queryKey[1] !== "attendance" || queryKey[2] !== "me") return false;
  const params = queryKey[3];
  if (!params || typeof params !== "object") return false;
  const p = params as Record<string, unknown>;
  const from = String(p.from ?? "").trim();
  const to = String(p.to ?? "").trim();
  const limit = Number(p.limit ?? 16);
  return from.length > 0 && from === to && limit <= 1;
}

export const hrmsAttendanceKeys = {
  all: ["hrms", "attendance"] as const,
  me: (params?: AttendanceQueryParams) =>
    [...hrmsAttendanceKeys.all, "me", normalizeAttendanceQueryParams(params)] as const,
  user: (userId: string, params?: AttendanceQueryParams) =>
    [...hrmsAttendanceKeys.all, "user", userId, normalizeAttendanceQueryParams(params)] as const,
};
