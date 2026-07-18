import { useQuery } from "@tanstack/react-query";
import { getDistributionAssignedWebsiteIds } from "@/api/distribution/distribution-setup.api";
import { distributionSetupKeys } from "./keys";

export function useDistributionAssignedWebsiteIdsQuery(enabled = true) {
  return useQuery({
    queryKey: distributionSetupKeys.assignedWebsiteIds(),
    queryFn: () => getDistributionAssignedWebsiteIds(),
    enabled,
    staleTime: 60_000,
  });
}
