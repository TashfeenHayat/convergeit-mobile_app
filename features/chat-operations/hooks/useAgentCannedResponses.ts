import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/api";
import { fetchAgentCannedResponses } from "@/services/chat/agent-canned.api";

/** Canned quick replies for the active conversation website (no department filter). */
export function useAgentCannedResponses(websiteId: string | null | undefined, apiEnabled = true) {
  const token = apiEnabled ? getAccessToken() ?? "" : "";
  const id = websiteId?.trim() ?? "";
  const enabled = apiEnabled && Boolean(token && id);

  return useQuery({
    queryKey: ["agent-canned", id],
    queryFn: () => fetchAgentCannedResponses(id, undefined, token),
    enabled,
    staleTime: 60_000,
    retry: false,
    meta: { skipGlobalToast: true },
  });
}
