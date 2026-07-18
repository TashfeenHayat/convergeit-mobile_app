import { useQuery } from "@tanstack/react-query";
import {
  listDistributionSetups,
  type ListDistributionSetupsParams,
} from "@/api/distribution/distribution-setup.api";
import { distributionSetupKeys } from "./keys";

export function useDistributionSetupsQuery(
  params: ListDistributionSetupsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: distributionSetupKeys.list(params),
    queryFn: () => listDistributionSetups(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
