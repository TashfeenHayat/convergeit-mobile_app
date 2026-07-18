import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChatScopeListQuery } from "@/services/chat/involvement-list.types";
import {
  fetchQaWebsiteRoster,
  listQaRosterInScope,
  saveQaWebsiteRoster,
} from "@/services/chat/qa-roster.api";
import { chatSettingsKeys } from "@/features/chat-settings/hooks/keys";

export const qaRosterListKeys = {
  all: ["qa-roster-list"] as const,
  scope: (q: ChatScopeListQuery) => [...qaRosterListKeys.all, "scope", q] as const,
  website: (websiteId: string) => [...qaRosterListKeys.all, "website", websiteId] as const,
};

export function useQaRosterListQuery(query: ChatScopeListQuery, enabled = true) {
  return useQuery({
    queryKey: qaRosterListKeys.scope(query),
    queryFn: () => listQaRosterInScope({ ...query, all: true }),
    enabled,
    staleTime: 30_000,
  });
}

export function useSaveQaRosterWebsiteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      websiteId,
      internalUserIds,
      externalUserIds,
    }: {
      websiteId: string;
      internalUserIds: string[];
      externalUserIds: string[];
    }) => saveQaWebsiteRoster(websiteId, { internalUserIds, externalUserIds }),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: qaRosterListKeys.all });
      void qc.invalidateQueries({
        queryKey: chatSettingsKeys.qaRosterExclusions(variables.websiteId),
      });
      void qc.invalidateQueries({ queryKey: chatSettingsKeys.qaRoster(variables.websiteId) });
    },
  });
}

export { fetchQaWebsiteRoster };
