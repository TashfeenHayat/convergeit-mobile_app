import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listUserShiftAssignments(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/user-shift-assignments", {
    params,
  });
  return data;
}

export async function createUserShiftAssignment(
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/user-shift-assignments", body);
  return data;
}

export async function removeUserShiftAssignment(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/user-shift-assignments/${encodeURIComponent(id)}`,
  );
  return data;
}
