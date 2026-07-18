import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAiTrainingAutomationFlow,
  fetchAiTrainingBehavior,
  fetchAiTrainingTestContext,
  patchAiTrainingAutomationFlow,
  patchAiTrainingBehavior,
  postAiTrainingTestRespond,
  type FlowBuilderGraph,
  type WebsiteAiBehavior,
} from "@/api/ai-training/ai-training.api";
import { aiTrainingKeys } from "./keys";

export function useAiTrainingBehaviorQuery(
  websiteId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiTrainingKeys.behavior(websiteId ?? ""),
    queryFn: () => fetchAiTrainingBehavior(websiteId!),
    enabled: (options?.enabled ?? true) && Boolean(websiteId?.trim()),
  });
}

export function useAiTrainingTestContextQuery(
  websiteId: string | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiTrainingKeys.testContext(websiteId ?? ""),
    queryFn: () => fetchAiTrainingTestContext(websiteId!),
    enabled: (options?.enabled ?? true) && Boolean(websiteId?.trim()),
  });
}

export function useUpdateAiTrainingBehaviorMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { websiteId: string; body: Partial<WebsiteAiBehavior> }) =>
      patchAiTrainingBehavior(params.websiteId, params.body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: aiTrainingKeys.behavior(vars.websiteId),
      });
    },
  });
}

export function useAiTrainingTestRespondMutation() {
  return useMutation({
    mutationFn: postAiTrainingTestRespond,
    meta: { skipSuccessToast: true },
  });
}

export function useAiTrainingAutomationFlowQuery(
  websiteId: string | undefined,
  variant: "chatbot" | "assistant",
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiTrainingKeys.automationFlow(websiteId ?? "", variant),
    queryFn: () => fetchAiTrainingAutomationFlow(websiteId!, variant),
    enabled: (options?.enabled ?? true) && Boolean(websiteId?.trim()),
  });
}

export function useSaveAiTrainingAutomationFlowMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      websiteId: string;
      variant: "chatbot" | "assistant";
      graph: FlowBuilderGraph;
    }) =>
      patchAiTrainingAutomationFlow(params.websiteId, {
        ...params.graph,
        variant: params.variant,
      }),
    meta: { skipSuccessToast: true },
    onSuccess: (data, vars) => {
      queryClient.setQueryData(
        aiTrainingKeys.automationFlow(vars.websiteId, vars.variant),
        data,
      );
    },
  });
}

export {
  useWebsiteAiSetupQuery,
  useCopilotWebsitesQuery,
  useApplyWebsiteAiSetupMutation,
  useApplyWebsiteAiTrainingMutation,
  useLlmProfilesQuery,
  useUpdateWebsiteAiModelsMutation,
} from "./website-setup-hooks";
