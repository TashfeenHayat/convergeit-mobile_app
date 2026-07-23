import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listDepartmentHeads(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/department-heads", { params });
  return data;
}

export async function listDepartmentHeadsAttendance(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/department-heads/attendance", { params });
  return data;
}

export async function listDepartmentHeadsReviewerAttendance(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get(
    "/hrms/department-heads/reviewer-attendance",
    { params },
  );
  return data;
}

export async function assignDepartmentHead(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/department-heads", body);
  return data;
}

export async function removeDepartmentHead(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/department-heads/${encodeURIComponent(id)}`,
  );
  return data;
}
