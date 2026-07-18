import { apiClient } from "../http/axios-instance";
import { sanitizePaginationQueryParams } from "@/lib/constants/pagination";
import type { JsonRecord } from "../types/common.types";

export async function listDesignations(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/hrms/designations", {
    params: sanitizePaginationQueryParams(params),
  });
  return data;
}

export async function getDesignation(id: string): Promise<unknown> {
  const { data } = await apiClient.get(`/hrms/designations/${encodeURIComponent(id)}`);
  return data;
}

export async function createDesignation(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/hrms/designations", body);
  return data;
}

export async function updateDesignation(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/hrms/designations/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function softDeleteDesignation(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(
    `/hrms/designations/${encodeURIComponent(id)}`,
  );
  return data;
}
