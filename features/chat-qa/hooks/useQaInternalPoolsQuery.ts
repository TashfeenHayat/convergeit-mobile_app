import { useQuery } from "@tanstack/react-query";
import { listQaDirectoryPools } from "@/services/chat/qa-directory.api";

export type QaInternalPoolsParams = {
  parentCompanyId?: string;
  resellerId?: string;
  requireResellerId?: boolean;
};

export function useQaInternalPoolsQuery(params: QaInternalPoolsParams, enabled = true) {
  const parentCompanyId = params.parentCompanyId?.trim() ?? "";
  const resellerId = params.resellerId?.trim() || undefined;
  // Internal pools are reseller-wide — resellerId and/or parentCompanyId resolves scope.
  const scopeReady =
    Boolean(resellerId) || Boolean(parentCompanyId) || !params.requireResellerId;

  return useQuery({
    queryKey: ["qa-directory-pools", parentCompanyId, resellerId] as const,
    queryFn: () =>
      listQaDirectoryPools({
        ...(resellerId ? { resellerId } : {}),
        ...(parentCompanyId ? { parentCompanyId } : {}),
      }),
    enabled: enabled && scopeReady,
    staleTime: 60_000,
  });
}
