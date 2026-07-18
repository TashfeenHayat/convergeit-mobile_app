import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function listDepartmentShiftAssignments(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/department-shift-assignments", {
    params,
  });
  return data;
}

export async function assignDepartmentShift(
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.post(
    "/hrms/department-shift-assignments",
    body,
  );
  return data;
}

export async function removeDepartmentShiftAssignment(
  id: string,
): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/department-shift-assignments/${encodeURIComponent(id)}`,
  );
  return data;
}
