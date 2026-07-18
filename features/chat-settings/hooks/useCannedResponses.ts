import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchWebsiteCannedResponses,
  listCannedResponses,
  replaceWebsiteCannedResponses,
} from "@/services/chat/canned-responses.api";
import type {
  ListCannedResponsesQuery,
  ReplaceWebsiteCannedBody,
} from "@/services/chat/canned-responses.types";
import { chatSettingsKeys } from "./keys";

export function useCannedResponsesListQuery(query: ListCannedResponsesQuery, enabled = true) {
  return useQuery({
    queryKey: chatSettingsKeys.cannedList(query),
    queryFn: () => listCannedResponses({ ...query, all: true }),
    enabled,
    staleTime: 30_000,
  });
}

export function useWebsiteCannedQuery(websiteId: string, enabled = true) {
  return useQuery({
    queryKey: chatSettingsKeys.cannedWebsite(websiteId),
    queryFn: () => fetchWebsiteCannedResponses(websiteId),
    enabled: Boolean(websiteId.trim()) && enabled,
    staleTime: 30_000,
  });
}

export function useReplaceWebsiteCannedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ websiteId, body }: { websiteId: string; body: ReplaceWebsiteCannedBody }) =>
      replaceWebsiteCannedResponses(websiteId, body),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: [...chatSettingsKeys.all, "canned"] });
      void qc.invalidateQueries({
        queryKey: chatSettingsKeys.cannedWebsite(vars.websiteId),
      });
      void qc.invalidateQueries({ queryKey: ["agent-canned", vars.websiteId] });
    },
  });
}
