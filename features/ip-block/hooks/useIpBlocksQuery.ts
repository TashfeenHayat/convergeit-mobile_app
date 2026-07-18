import { useQuery } from "@tanstack/react-query";
import {
  listIpBlocks,
  type ListIpBlocksParams,
} from "@/api/ip-block/ip-block.api";
import { ipBlockKeys } from "./keys";

export function useIpBlocksQuery(params: ListIpBlocksParams, enabled = true) {
  return useQuery({
    queryKey: ipBlockKeys.list(params),
    queryFn: () => listIpBlocks(params),
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
