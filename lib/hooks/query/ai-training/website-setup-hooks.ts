import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyWebsiteAiSetup,
  applyWebsiteAiTraining,
  fetchLlmProfiles,
  fetchWebsiteAiSetup,
  listCopilotWebsites,
  updateWebsiteAiModels,
  type ListCopilotWebsitesParams,
  type WebsiteAiSetupPayload,
  type WebsiteAiTrainingPayload,
} from "@/api/ai-training/website-setup.api";
import { aiTrainingKeys } from "./keys";

export function useCopilotWebsitesQuery(
  params: ListCopilotWebsitesParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiTrainingKeys.copilotWebsites(params),
    queryFn: () => listCopilotWebsites(params),
    enabled: options?.enabled ?? true,
  });
}

export function useWebsiteAiSetupQuery(
  websiteId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiTrainingKeys.websiteSetup(websiteId ?? ""),
    queryFn: () => fetchWebsiteAiSetup(websiteId!),
    enabled: (options?.enabled ?? true) && Boolean(websiteId?.trim()),
  });
}

export function useLlmProfilesQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: aiTrainingKeys.llmProfiles(),
    queryFn: fetchLlmProfiles,
    enabled: options?.enabled ?? true,
  });
}

export function useApplyWebsiteAiSetupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { websiteId: string; body: WebsiteAiSetupPayload }) =>
      applyWebsiteAiSetup(params.websiteId, params.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.websiteSetup(vars.websiteId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...aiTrainingKeys.all, "copilot-websites"],
      });
      void queryClient.invalidateQueries({ queryKey: ["ai-knowledge"] });
    },
  });
}

export function useApplyWebsiteAiTrainingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { websiteId: string; body: WebsiteAiTrainingPayload }) =>
      applyWebsiteAiTraining(params.websiteId, params.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ai-knowledge"] });
    },
  });
}

export function useUpdateWebsiteAiModelsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      websiteId: string;
      body: Partial<Pick<WebsiteAiSetupPayload, "chatbotProfileId" | "copilotProfileId" | "tone">>;
    }) => updateWebsiteAiModels(params.websiteId, params.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.websiteSetup(vars.websiteId),
      });
      void queryClient.invalidateQueries({
        queryKey: [...aiTrainingKeys.all, "copilot-websites"],
      });
    },
  });
}
