import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

/** Cross-pool listing (optional filters). Omit poolId to list members in scope. */
export async function listHrmsPoolMembers(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/pool-members", { params });
  return data;
}

export async function listPoolMembers(
  poolId: string,
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    `/hrms/pools/${encodeURIComponent(poolId)}/members`,
    { params },
  );
  return data;
}

type AddPoolMemberInput = JsonRecord | string;

function toAddPoolMemberBody(input: AddPoolMemberInput): JsonRecord {
  if (typeof input === "string") {
    return { userId: input.trim() };
  }

  const userId = String(input.userId ?? input.user_id ?? "").trim();
  return { userId };
}

export async function addPoolMember(poolId: string, input: AddPoolMemberInput): Promise<unknown> {
  const { data } = await apiClient.post(
    `/hrms/pools/${encodeURIComponent(poolId)}/members`,
    toAddPoolMemberBody(input),
  );
  return data;
}

export async function addPoolMembersBulk(
  poolId: string,
  userIds: string[],
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/hrms/pools/${encodeURIComponent(poolId)}/members/bulk`,
    { userIds },
  );
  return data;
}

export async function getPoolMember(poolId: string, userId: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/hrms/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(userId)}`,
  );
  return data;
}

export async function movePoolMember(
  poolId: string,
  userId: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(userId)}`,
    body,
  );
  return data;
}

export async function removePoolMember(poolId: string, userId: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/pools/${encodeURIComponent(poolId)}/members/${encodeURIComponent(userId)}`,
  );
  return data;
}
