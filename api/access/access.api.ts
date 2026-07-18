import { apiClient } from "../http/axios-instance";
import type { JsonRecord } from "../types/common.types";

export async function getMyEffectivePermissions(): Promise<unknown> {
  const { data } = await apiClient.get("/access/me/effective-permissions");
  return data;
}

export async function listPermissionsCatalog(params?: JsonRecord): Promise<unknown> {
  const { data } = await apiClient.get("/access/permissions/catalog", { params });
  return data;
}

/** Preview runtime expansion for role editor (bundles, legacy page gates). */
export async function expandPermissionNames(body: {
  permissionNames: string[];
  selectedPermissionNames?: string[];
}): Promise<unknown> {
  const { data } = await apiClient.post("/access/permissions/expand", body);
  return data;
}

export async function getPermissionApplicability(
  permissionName: string,
): Promise<unknown> {
  const { data } = await apiClient.get(
    `/access/permissions/${encodeURIComponent(permissionName)}/applicability`,
  );
  return data;
}

export async function replacePermissionApplicability(
  permissionName: string,
  body: JsonRecord,
): Promise<unknown> {
  const { data } = await apiClient.put(
    `/access/permissions/${encodeURIComponent(permissionName)}/applicability`,
    body,
  );
  return data;
}
