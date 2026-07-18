import { apiClient } from "../http/axios-instance";

export type SellableModuleCatalogItem = {
  code: string;
  name: string;
  description: string;
  category: "software" | "service";
  productFamily?: "live_chat";
  softwareOnly: boolean;
  defaultMonthlyPrice?: number;
  permissionNames: string[];
  pagePermissionNames: string[];
};

export type ResellerModulePreset = {
  code: string;
  label: string;
  description: string;
  moduleCodes: string[];
};

export type ResellerModulesCatalog = {
  basePagePermissions: string[];
  modules: SellableModuleCatalogItem[];
  presets: ResellerModulePreset[];
};

export type ResellerModulesState = {
  resellerId: string;
  moduleCodes: string[];
  permissionNames: string[];
  modulePricesByCode?: Record<string, number>;
};

export async function getResellerModulesCatalog() {
  const { data } = await apiClient.get<{ success: boolean; data: ResellerModulesCatalog }>(
    "/companies/resellers/modules/catalog",
  );
  return data;
}

export async function getResellerModules(resellerId: string) {
  const { data } = await apiClient.get<{ success: boolean; data: ResellerModulesState }>(
    `/companies/resellers/${encodeURIComponent(resellerId)}/modules`,
  );
  return data;
}

export async function putResellerModules(
  resellerId: string,
  body: { moduleCodes?: string[]; preset?: string },
) {
  const { data } = await apiClient.put<{ success: boolean; data: ResellerModulesState }>(
    `/companies/resellers/${encodeURIComponent(resellerId)}/modules`,
    body,
  );
  return data;
}

export async function putResellerModulePrices(
  resellerId: string,
  modulePricesByCode: Record<string, number>,
) {
  const { data } = await apiClient.put<{
    success: boolean;
    data: ResellerModulesState;
  }>(`/companies/resellers/${encodeURIComponent(resellerId)}/modules/prices`, {
    modulePricesByCode,
  });
  return data;
}
