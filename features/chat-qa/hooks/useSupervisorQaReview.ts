import { useQuery } from "@tanstack/react-query";
import { getAccessToken } from "@/api";
import { fetchSupervisorQaReviewBundle } from "@/services/chat/reports.api";

export function useSupervisorQaReview(
  conversationId: string | null,
  options?: { enabled?: boolean },
) {
  const token = getAccessToken() ?? "";
  const enabled = (options?.enabled !== false) && Boolean(conversationId) && Boolean(token);

  return useQuery({
    queryKey: ["qa-supervisor-review", conversationId],
    queryFn: () => fetchSupervisorQaReviewBundle(conversationId!, token),
    enabled,
    staleTime: 60_000,
  });
}
