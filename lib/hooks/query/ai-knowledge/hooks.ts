import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAiChatbotSource,
  listAiChatbotSourceChunks,
  listAiChatbotSources,
  listAiChatbotTrainingWebsites,
  postAiChatbotReindex,
  postAiChatbotSourceJson,
} from "@/api/ai-chatbot/ai-chatbot-knowledge.api";
import {
  deleteAiAssistantKbSource,
  listAiAssistantKbSourceChunks,
  listAiAssistantKbSources,
  listAiAssistantKbTrainingWebsites,
  postAiAssistantKbReindex,
  postAiAssistantKbSourceJson,
  postAiAssistantKbSourceMultipart,
  type UploadAssistantKbSourceParams,
} from "@/api/ai-assistant/ai-assistant-kb.api";
import type {
  CreateKnowledgeSourceJsonBody,
  ListKbTrainingWebsitesParams,
  ListKnowledgeSourceChunksParams,
  ListKnowledgeSourcesParams,
  ReindexKnowledgeBody,
} from "@/api/ai-knowledge/types";
import { aiAssistantKbKeys, aiChatbotKnowledgeKeys } from "./keys";

export function useAiChatbotSourcesQuery(
  params: ListKnowledgeSourcesParams | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?:
      | number
      | false
      | ((query: { state: { data?: { items: { status: string }[] } } }) => number | false);
  },
) {
  return useQuery({
    queryKey: aiChatbotKnowledgeKeys.sources(params),
    queryFn: () => listAiChatbotSources(params),
    enabled: (options?.enabled ?? true) && Boolean(params?.websiteId?.trim()),
    refetchInterval: options?.refetchInterval,
  });
}

export function useAiAssistantKbSourcesQuery(
  params: ListKnowledgeSourcesParams | undefined,
  options?: {
    enabled?: boolean;
    refetchInterval?:
      | number
      | false
      | ((query: { state: { data?: { items: { status: string }[] } } }) => number | false);
  },
) {
  return useQuery({
    queryKey: aiAssistantKbKeys.sources(params),
    queryFn: () => listAiAssistantKbSources(params),
    enabled: (options?.enabled ?? true) && Boolean(params?.websiteId?.trim()),
    refetchInterval: options?.refetchInterval,
  });
}

export function useCreateAiChatbotSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateKnowledgeSourceJsonBody) => postAiChatbotSourceJson(body),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiChatbotKnowledgeKeys.all });
    },
  });
}

export function useCreateAiAssistantKbSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: CreateKnowledgeSourceJsonBody | UploadAssistantKbSourceParams) => {
      if ("file" in vars) return postAiAssistantKbSourceMultipart(vars);
      return postAiAssistantKbSourceJson(vars);
    },
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiAssistantKbKeys.all });
    },
  });
}

export function useDeleteAiChatbotSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => deleteAiChatbotSource(sourceId),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiChatbotKnowledgeKeys.all });
    },
  });
}

export function useDeleteAiAssistantKbSourceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: string) => deleteAiAssistantKbSource(sourceId),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiAssistantKbKeys.all });
    },
  });
}

export function useAiChatbotReindexMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReindexKnowledgeBody) => postAiChatbotReindex(body),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiChatbotKnowledgeKeys.all });
    },
  });
}

export function useAiAssistantKbReindexMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReindexKnowledgeBody) => postAiAssistantKbReindex(body),
    meta: { skipSuccessToast: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: aiAssistantKbKeys.all });
    },
  });
}

export function useAiChatbotTrainingWebsitesQuery(
  params: ListKbTrainingWebsitesParams | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiChatbotKnowledgeKeys.trainingWebsites(params),
    queryFn: () => listAiChatbotTrainingWebsites(params),
    enabled: (options?.enabled ?? true) && Boolean(params),
  });
}

export function useAiAssistantKbTrainingWebsitesQuery(
  params: ListKbTrainingWebsitesParams | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: aiAssistantKbKeys.trainingWebsites(params),
    queryFn: () => listAiAssistantKbTrainingWebsites(params),
    enabled: (options?.enabled ?? true) && Boolean(params),
  });
}

export function useAiChatbotSourceChunksQuery(
  sourceId: string | null,
  params?: ListKnowledgeSourceChunksParams,
  options?: { enabled?: boolean },
) {
  const id = sourceId?.trim() ?? "";
  return useQuery({
    queryKey: aiChatbotKnowledgeKeys.sourceChunks(id, params),
    queryFn: () => listAiChatbotSourceChunks(id, params),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}

export function useAiAssistantKbSourceChunksQuery(
  sourceId: string | null,
  params?: ListKnowledgeSourceChunksParams,
  options?: { enabled?: boolean },
) {
  const id = sourceId?.trim() ?? "";
  return useQuery({
    queryKey: aiAssistantKbKeys.sourceChunks(id, params),
    queryFn: () => listAiAssistantKbSourceChunks(id, params),
    enabled: (options?.enabled ?? true) && id.length > 0,
  });
}
