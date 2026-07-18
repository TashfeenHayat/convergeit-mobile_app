import { apiClient } from "../http/axios-instance";

export async function getClientPermissions(parentCompanyId: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/companies/${encodeURIComponent(parentCompanyId)}/client-permissions`,
  );
  return data;
}

export async function putClientPermissions(
  parentCompanyId: string,
  body: { permissionNames: string[] },
): Promise<unknown> {
  const { data } = await apiClient.put(
    `/companies/${encodeURIComponent(parentCompanyId)}/client-permissions`,
    body,
  );
  return data;
}
