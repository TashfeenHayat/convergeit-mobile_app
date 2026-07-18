import { apiClient } from "../http/axios-instance";

export type OfferingType = "software" | "service" | "both" | "none";

export type ResellerServicesAccessRow = {
  resellerId: string;
  name: string;
  moduleCodes: string[];
  offeringType: OfferingType;
  parentCompanyCount: number;
  updatedAt: string | null;
};

export type ClientServicesAccessRow = {
  parentCompanyId: string;
  name: string;
  resellerId: string;
  resellerName: string;
  moduleCodes: string[];
  offeringType: OfferingType;
  childCompanyCount: number;
  websiteCount: number;
  updatedAt: string | null;
  inheritedFromReseller: true;
};

export type ServicesAccessList<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ServicesAccessListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getResellerServicesAccess(params?: ServicesAccessListParams) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ServicesAccessList<ResellerServicesAccessRow>;
  }>("/companies/services-access/resellers", { params });
  return data;
}

export async function getClientServicesAccess(params?: ServicesAccessListParams) {
  const { data } = await apiClient.get<{
    success: boolean;
    data: ServicesAccessList<ClientServicesAccessRow>;
  }>("/companies/services-access/clients", { params });
  return data;
}
