import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listHrmsPoolMembers } from "@/api/hrms";
import type { JsonRecord } from "@/api/types/common.types";
import { isRecord, pickNum, pickStr, unwrapApiData } from "@/lib/utils/core";
import { hrmsPoolMembersKeys } from "./keys";

function rowsFromAggregatePayload(data: unknown): Record<string, unknown>[] {
  const p = unwrapApiData(data);
  if (Array.isArray(p)) return p.filter(isRecord);
  if (!isRecord(p)) return [];
  for (const key of ["items", "results", "rows", "members"] as const) {
    const arr = p[key];
    if (Array.isArray(arr)) return arr.filter(isRecord);
  }
  return [];
}

function readListTotal(data: unknown): number | null {
  const p = unwrapApiData(data);
  if (!isRecord(p)) return null;
  return pickNum(p, ["total", "totalCount", "count"]);
}

/** Per-request page size; must stay within API `limit` max (often 100). */
const AGGREGATE_PAGE_SIZE = 100;
/** Safety cap on how many list pages we merge for one hub load. */
const AGGREGATE_MAX_PAGES = 500;

async function fetchAllPoolMemberRecords(base: JsonRecord): Promise<Record<string, unknown>[]> {
  const merged: Record<string, unknown>[] = [];
  let reportedTotal: number | null = null;

  for (let page = 1; page <= AGGREGATE_MAX_PAGES; page += 1) {
    const raw = await listHrmsPoolMembers({
      ...base,
      page,
      limit: AGGREGATE_PAGE_SIZE,
    });
    if (page === 1) reportedTotal = readListTotal(raw);

    const batch = rowsFromAggregatePayload(raw);
    merged.push(...batch);

    if (batch.length === 0) break;
    if (batch.length < AGGREGATE_PAGE_SIZE) break;
    if (reportedTotal != null && merged.length >= reportedTotal) break;
  }

  return merged;
}

function memberDisplayName(r: Record<string, unknown>): string {
  const first = pickStr(r, ["firstName", "first_name"]) || "";
  const last = pickStr(r, ["lastName", "last_name"]) || "";
  const joined = `${first} ${last}`.trim();
  if (joined) return joined;
  return pickStr(r, ["name", "fullName", "userName"]) || "—";
}

export type MergedPoolMemberRow = {
  rowKey: string;
  poolId: string;
  poolName: string;
  departmentName: string;
  departmentId: string;
  userId: string;
  memberName: string;
  email: string;
};

export type DepartmentPoolMembersMergedOptions = {
  /** Client-side filter: member name / email (substring, case-insensitive). */
  search?: string;
  /** Client-side filter: pool name (substring, case-insensitive). */
  poolName?: string;
  /** Client-side filter: department name (substring, case-insensitive). */
  departmentName?: string;
  /** 1-based page over the filtered list. */
  page?: number;
  /** Page size for client-side pagination. */
  pageSize?: number;
};

function toMergedPoolMemberRow(r: Record<string, unknown>): MergedPoolMemberRow | null {
  const poolObj = isRecord(r["pool"]) ? (r["pool"] as Record<string, unknown>) : null;
  const userObj = isRecord(r["user"]) ? (r["user"] as Record<string, unknown>) : null;
  const membershipDept = poolObj && isRecord(poolObj["department"])
    ? (poolObj["department"] as Record<string, unknown>)
    : null;
  const deptObj =
    (isRecord(r["department"]) ? (r["department"] as Record<string, unknown>) : null) ?? membershipDept;

  const poolId = pickStr(r, ["poolId"]) || pickStr(poolObj, ["id"]) || "";
  const poolName =
    pickStr(r, ["poolName"]) || pickStr(poolObj, ["name", "poolName", "title"]) || "—";

  const departmentId =
    pickStr(r, ["poolDepartmentId", "departmentId"]) ||
    pickStr(deptObj, ["id"]) ||
    pickStr(poolObj, ["departmentId", "department_id"]) ||
    "";

  const departmentName =
    pickStr(r, ["poolDepartmentName", "departmentName"]) ||
    pickStr(deptObj, ["name"]) ||
    "—";

  const userId =
    pickStr(r, ["userId", "user_id", "memberUserId"]) ||
    pickStr(userObj, ["id", "userId"]) ||
    pickStr(r, ["id"]) ||
    "";

  if (!poolId || !userId) return null;

  const nameSource = userObj ?? r;
  const memberName = memberDisplayName(nameSource as Record<string, unknown>);
  const email = pickStr(r, ["email"]) || pickStr(userObj, ["email"]) || "—";

  return {
    rowKey: `${poolId}:${userId}`,
    poolId,
    poolName,
    departmentName,
    departmentId,
    userId,
    memberName,
    email,
  };
}

/**
 * Pool members hub: GET `/hrms/pool-members` (optional `departmentId`, `poolId` from session; omit filters for broad scope),
 * pages with {@link AGGREGATE_PAGE_SIZE} until the list is exhausted, then client-side search / filters
 * and pagination.
 */
export function useDepartmentPoolMembersMerged(
  departmentId: string | undefined,
  sessionPoolId: string | undefined,
  enabled: boolean,
  options?: DepartmentPoolMembersMergedOptions,
) {
  const dept = (departmentId ?? "").trim();
  const scopedPool = (sessionPoolId ?? "").trim();
  const search = options?.search?.trim() ?? "";
  const poolName = options?.poolName?.trim() ?? "";
  const departmentName = options?.departmentName?.trim() ?? "";
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 10);

  const fetchParams = useMemo((): JsonRecord => {
    return {
      ...(dept ? { departmentId: dept } : {}),
      ...(scopedPool ? { poolId: scopedPool } : {}),
    };
  }, [dept, scopedPool]);

  const aggregateQuery = useQuery({
    queryKey: [...hrmsPoolMembersKeys.aggregateList(fetchParams), "paged-merge"] as const,
    queryFn: async () => {
      const items = await fetchAllPoolMemberRecords(fetchParams);
      return { items };
    },
    enabled,
    placeholderData: keepPreviousData,
  });

  const allMergedRows = useMemo(() => {
    const raw = rowsFromAggregatePayload(aggregateQuery.data);
    return raw
      .map(toMergedPoolMemberRow)
      .filter((x): x is MergedPoolMemberRow => x !== null);
  }, [aggregateQuery.data]);

  const filteredRows = useMemo(() => {
    const poolQ = poolName.toLowerCase();
    const deptQ = departmentName.toLowerCase();
    const searchQ = search.toLowerCase();
    return allMergedRows.filter((row) => {
      if (searchQ) {
        const hay = `${row.memberName} ${row.email}`.toLowerCase();
        if (!hay.includes(searchQ)) return false;
      }
      if (poolQ && !row.poolName.toLowerCase().includes(poolQ)) return false;
      if (deptQ && !row.departmentName.toLowerCase().includes(deptQ)) return false;
      return true;
    });
  }, [allMergedRows, search, poolName, departmentName]);

  const total = filteredRows.length;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  const mergedRows = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize, totalPages]);

  return {
    mergedRows,
    total,
    totalPages,
    isLoading: aggregateQuery.isLoading,
    isFetching: aggregateQuery.isFetching,
  };
}
