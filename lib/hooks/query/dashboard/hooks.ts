import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchPlatformOverview,
  type PlatformOverviewQuery,
} from "@/api/dashboard";
import { dashboardKeys } from "./keys";

export function usePlatformOverviewQuery(
  query: PlatformOverviewQuery = {},
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: dashboardKeys.platformOverview(query),
    queryFn: () => fetchPlatformOverview(query),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
