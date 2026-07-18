import { apiClient } from "../http/axios-instance";
import { sanitizePaginationQueryParams } from "@/lib/constants/pagination";
import type { JsonRecord } from "../types/common.types";

export async function getUserFilterSuggestions(
  params?: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.get("/users/filter-suggestions", {
    params,
  });
  return data;
}

export async function listUsers(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/users", {
    params: sanitizePaginationQueryParams(params),
  });
  return data;
}

export async function getUser(id: string): Promise<unknown> {
  const { data } = await apiClient.get(`/users/${encodeURIComponent(id)}`);
  return data;
}

export async function createUser(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/users", body);
  return data;
}

export async function bulkSoftDeleteUsers(body: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.post("/users/bulk-delete", body);
  return data;
}

export async function updateUser(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.patch(`/users/${encodeURIComponent(id)}`, body);
  return data;
}

export async function softDeleteUser(id: string): Promise<unknown> {
  const { data } = await apiClient.delete(`/users/${encodeURIComponent(id)}`);
  return data;
}

export async function getUserPermissions(id: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/users/${encodeURIComponent(id)}/permissions`,
  );
  return data;
}

export async function replaceUserPermissionOverrides(
  id: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.put(
    `/users/${encodeURIComponent(id)}/permissions`,
    body,
  );
  return data;
}
