import type {
  ListKbTrainingWebsitesParams,
  ListKnowledgeSourcesParams,
} from "@/api/ai-knowledge/types";

export const aiChatbotKnowledgeKeys = {
  all: ["ai-chatbot-knowledge"] as const,
  sources: (params?: ListKnowledgeSourcesParams) =>
    [...aiChatbotKnowledgeKeys.all, "sources", params ?? {}] as const,
  sourceChunks: (sourceId: string, params?: { limit?: number; offset?: number }) =>
    [...aiChatbotKnowledgeKeys.all, "chunks", sourceId, params ?? {}] as const,
  trainingWebsites: (params?: ListKbTrainingWebsitesParams) =>
    [...aiChatbotKnowledgeKeys.all, "training-websites", params ?? {}] as const,
};

export const aiAssistantKbKeys = {
  all: ["ai-assistant-kb"] as const,
  sources: (params?: ListKnowledgeSourcesParams) =>
    [...aiAssistantKbKeys.all, "sources", params ?? {}] as const,
  sourceChunks: (sourceId: string, params?: { limit?: number; offset?: number }) =>
    [...aiAssistantKbKeys.all, "chunks", sourceId, params ?? {}] as const,
  trainingWebsites: (params?: ListKbTrainingWebsitesParams) =>
    [...aiAssistantKbKeys.all, "training-websites", params ?? {}] as const,
};
