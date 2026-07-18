import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listLeaveTypes(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/leave-types", { params });
  return data;
}

export async function createLeaveType(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/leave-types", body);
  return data;
}

export async function listLeaveTypesForApply(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/leave-types/for-apply", {
    params,
  });
  return data;
}

export async function updateLeaveType(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/leave-types/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function deleteLeaveType(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/leave-types/${encodeURIComponent(id)}`,
  );
  return data;
}
