import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listPoolShiftAssignments(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/pool-shift-assignments", {
    params,
  });
  return data;
}

export async function assignPoolShift(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/pool-shift-assignments", body);
  return data;
}

export async function removePoolShiftAssignment(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/pool-shift-assignments/${encodeURIComponent(id)}`,
  );
  return data;
}
