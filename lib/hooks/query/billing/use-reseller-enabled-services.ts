import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getResellerModules, getResellerModulesCatalog } from "@/api/companies/reseller-modules.api";
import type { BillingEnabledService } from "@/lib/billing/billing-rate-fields";

export function useResellerEnabledServices(resellerId: string, options?: { enabled?: boolean }) {
  const enabled = (options?.enabled ?? true) && Boolean(resellerId.trim());

  const modulesCatalogQuery = useQuery({
    queryKey: ["reseller-modules-catalog"],
    queryFn: getResellerModulesCatalog,
    enabled,
  });

  const resellerModulesQuery = useQuery({
    queryKey: ["reseller-modules", resellerId],
    queryFn: () => getResellerModules(resellerId),
    enabled,
  });

  const enabledServices = useMemo((): BillingEnabledService[] => {
    const catalog = modulesCatalogQuery.data?.data.modules ?? [];
    const moduleCodes = new Set(resellerModulesQuery.data?.data.moduleCodes ?? []);
    return catalog
      .filter((m) => moduleCodes.has(m.code))
      .map((m) => ({
        code: m.code,
        name: m.name,
      }));
  }, [modulesCatalogQuery.data?.data.modules, resellerModulesQuery.data?.data.moduleCodes]);

  return {
    enabledServices,
    isLoading: modulesCatalogQuery.isLoading || resellerModulesQuery.isLoading,
    refetch: async () => {
      await Promise.all([modulesCatalogQuery.refetch(), resellerModulesQuery.refetch()]);
    },
  };
}
