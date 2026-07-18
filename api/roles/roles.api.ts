import { apiClient } from "../http/axios-instance";
import { sanitizePaginationQueryParams } from "@/lib/constants/pagination";
import type { JsonRecord } from "../types/common.types";

export async function listRoles(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/roles", {
    params: sanitizePaginationQueryParams(params),
  });
  return data;
}

export async function createRole(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/roles", body);
  return data;
}

export async function updateRole(id: string, body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/roles/${encodeURIComponent(id)}`,
    body,
  );
  return data;
}

export async function softDeleteRole(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(`/roles/${encodeURIComponent(id)}`);
  return data;
}

export async function getRole(id: string): Promise<unknown> {
  const { data } = await apiClient.get(`/roles/${encodeURIComponent(id)}`);
  return data;
}

export async function getRolePermissions(id: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/roles/${encodeURIComponent(id)}/permissions`,
  );
  return data;
}

export async function replaceRolePermissions(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.put(
    `/roles/${encodeURIComponent(id)}/permissions`,
    body,
  );
  return data;
}
