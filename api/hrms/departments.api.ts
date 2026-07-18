import { apiClient } from "../http/axios-instance";
import { sanitizePaginationQueryParams } from "@/lib/constants/pagination";
import type { JsonRecord } from "../types/common.types";

/** Drop empty strings so axios does not send `resellerId=` / `parentCompanyId=` and confuse the API. */
function compactDepartmentListParams(params?: JsonRecord): JsonRecord | undefined {
  if (!params) return undefined;
  const out: JsonRecord = {};
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    if (typeof raw === "string" && !raw.trim()) continue;
    out[key] = raw;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export async function listDepartments(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/departments", {
    params: compactDepartmentListParams(
      sanitizePaginationQueryParams(params) as JsonRecord | undefined,
    ),
  });
  return data;
}

export async function getDepartment(id: string): Promise<unknown> {
  const { data } = await apiClient.get(`/hrms/departments/${encodeURIComponent(id)}`);
  return data;
}

export async function createDepartment(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/departments", body);
  return data;
}

export async function updateDepartment(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/departments/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function softDeleteDepartment(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/departments/${encodeURIComponent(id)}`,
  );
  return data;
}
