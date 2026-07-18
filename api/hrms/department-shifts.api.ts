import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

/** `GET /hrms/department-shifts` — query: `page`, `limit`, `all`, `departmentId`, `parentCompanyId`, `search`, `shiftScope`. */
export async function listDepartmentShifts(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/department-shifts", { params });
  return data;
}

export async function enableDepartmentShift(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/department-shifts", body);
  return data;
}

export async function removeDepartmentShift(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/department-shifts/${encodeURIComponent(id)}`,
  );
  return data;
}
