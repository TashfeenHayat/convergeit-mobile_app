import type { JsonRecord } from "@/api/types/common.types";

type Params = JsonRecord | undefined;

export const hrmsPoolMembersKeys = {
  all: ["hrms", "pool-members"] as const,
  list: (poolId: string, params?: Params) =>
    [...hrmsPoolMembersKeys.all, poolId, "list", params ?? {}] as const,
  /** GET /hrms/pool-members — aggregate list (optional departmentId, page, limit, …). */
  aggregateList: (params?: Params) => [...hrmsPoolMembersKeys.all, "aggregate", params ?? {}] as const,
  detail: (poolId: string, userId: string) =>
    [...hrmsPoolMembersKeys.all, poolId, "detail", userId] as const,
};
