import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

/**
 * `GET /hrms/shifts` — list shift templates (server-side filters).
 * Query: camelCase `page` | `limit` | `all` | `parentCompanyId` | `search` | `shiftScope` (`internal` | `external` | `all`).
 * `search` max 80 chars via `buildHrmsShiftsListQueryRecord`. Response may include `workingDaysMask`, `workingWeekdays`, `catalog`, `ownerResellerName`, `ownerParentCompanyName`.
 */
export async function listShiftTemplates(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/shifts", { params });
  return data;
}

export async function createShiftTemplate(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/shifts", body);
  return data;
}

export async function getShiftTemplate(id: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/hrms/shifts/${encodeURIComponent(id)}`,
  );
  return data;
}

export async function updateShiftTemplate(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/shifts/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function deleteShiftTemplate(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/shifts/${encodeURIComponent(id)}`,
  );
  return data;
}
