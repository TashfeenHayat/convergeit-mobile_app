import { useQuery } from "@tanstack/react-query";
import {
  getClientServicesAccess,
  getResellerServicesAccess,
  type ServicesAccessListParams,
} from "@/api/companies/services-access.api";

export const servicesAccessKeys = {
  all: ["companies", "services-access"] as const,
  resellers: (params: ServicesAccessListParams) =>
    [...servicesAccessKeys.all, "resellers", params] as const,
  clients: (params: ServicesAccessListParams) =>
    [...servicesAccessKeys.all, "clients", params] as const,
};

export function useResellerServicesAccessQuery(
  params: ServicesAccessListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: servicesAccessKeys.resellers(params),
    queryFn: () => getResellerServicesAccess(params),
    enabled: options?.enabled ?? true,
  });
}

export function useClientServicesAccessQuery(
  params: ServicesAccessListParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: servicesAccessKeys.clients(params),
    queryFn: () => getClientServicesAccess(params),
    enabled: options?.enabled ?? true,
  });
}
