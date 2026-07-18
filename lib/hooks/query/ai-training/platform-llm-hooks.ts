import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchPlatformAiOverview,
  fetchPlatformLlmProviders,
  upsertPlatformLlmKey,
  upsertPlatformLlmKeysBatch,
  type UpsertPlatformLlmKeyPayload,
} from "@/api/ai-training/platform-llm.api";
import { aiTrainingKeys } from "./keys";

export function usePlatformLlmProvidersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiTrainingKeys.platformLlmProviders(),
    queryFn: fetchPlatformLlmProviders,
    enabled: options?.enabled ?? true,
  });
}

export function usePlatformAiOverviewQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiTrainingKeys.platformAiOverview(),
    queryFn: fetchPlatformAiOverview,
    enabled: options?.enabled ?? true,
  });
}

export function useUpsertPlatformLlmKeyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpsertPlatformLlmKeyPayload) => upsertPlatformLlmKey(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.platformLlmProviders(),
      });
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.platformAiOverview(),
      });
    },
  });
}

export function useUpsertPlatformLlmKeysBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keys: UpsertPlatformLlmKeyPayload[]) =>
      upsertPlatformLlmKeysBatch(keys),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.platformLlmProviders(),
      });
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.platformAiOverview(),
      });
      void queryClient.invalidateQueries({ queryKey: aiTrainingKeys.llmProfiles() });
    },
  });
}
