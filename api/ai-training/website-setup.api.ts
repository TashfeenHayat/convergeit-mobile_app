import { apiClient } from "../http/axios-instance";
import { unwrapAiKnowledgeData } from "../ai-knowledge/unwrap";
import type { WebsiteAiBehavior } from "./ai-training.api";
import type { AiUsageSummary } from "./platform-llm.api";

export type LlmProfileOption = {
  id: string;
  name: string;
  description: string | null;
  generationModel: string;
  embeddingModel?: string | null;
  maxOutputTokens: number;
  temperature: number;
  generationProvider: { code: string; name: string };
  embeddingProvider?: { code: string; name: string } | null;
};

export type WebsiteAiAgentConfig = {
  profileId: string;
  profileName: string;
  description: string | null;
  providerCode: string;
  providerName: string;
  generationModel: string;
  embeddingModel: string | null;
  embeddingProviderName: string | null;
  maxOutputTokens: number;
  temperature: number;
  usage: {
    promptTokens: number;
    completionTokens: number;
    embeddingTokens: number;
    totalTokens: number;
    requestCount: number;
  } | null;
};

export type WebsiteAiSetupPromotion = {
  id: string;
  title: string;
  body: string;
  validFrom: string | null;
  validTo: string | null;
  priority: number;
};

export type WebsiteAiCopilotStatus = {
  chatbotConfigured: boolean;
  assistantConfigured: boolean;
  copilotProfileConfigured: boolean;
  inheritsFromChatbotAndAssistant: boolean;
  copilotReady: boolean;
};

export type CopilotWebsiteSummary = {
  websiteId: string;
  name: string;
  url: string;
  childCompanyId: string;
  childCompanyName: string;
  parentCompanyId: string;
  parentCompanyName: string;
  resellerId: string;
  chatbotProfileName: string | null;
  copilotProfileName: string | null;
  copilotStatus: WebsiteAiCopilotStatus;
};

export type ListCopilotWebsitesParams = {
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  limit?: number;
  offset?: number;
};

export type ListCopilotWebsitesResult = {
  items: CopilotWebsiteSummary[];
  total: number;
};

export type WebsiteAiSetupState = {
  website: { id: string; name: string | null; url: string };
  setup: {
    chatbotProfileId: string | null;
    copilotProfileId: string | null;
    tone: "PROFESSIONAL" | "FRIENDLY" | "SALES";
    setupCompletedAt: string | null;
    promotions: WebsiteAiSetupPromotion[];
    agents: {
      chatbot: WebsiteAiAgentConfig | null;
      copilot: WebsiteAiAgentConfig | null;
    };
  } | null;
  copilotStatus: WebsiteAiCopilotStatus;
  behavior: WebsiteAiBehavior;
  profiles: LlmProfileOption[];
  configuredProviders: {
    id: string;
    code: string;
    name: string;
    keyConfigured: boolean;
  }[];
  usage: AiUsageSummary;
};

export type WebsiteAiSetupPayload = {
  chatbotProfileId?: string;
  copilotProfileId?: string;
  tone?: "PROFESSIONAL" | "FRIENDLY" | "SALES";
  promotions?: {
    title: string;
    body: string;
    validFrom?: string;
    validTo?: string;
    priority?: number;
  }[];
  behavior?: Partial<WebsiteAiBehavior>;
};

export type WebsiteAiTrainingPayload = {
  enableScrape?: boolean;
  scrapeUrl?: string;
  chatbotFaqRows?: { question: string; answer: string }[];
  copilotFaqRows?: { question: string; answer: string }[];
  chatExportText?: string;
  trainChatbotFromChat?: boolean;
  trainCopilotFromChat?: boolean;
};

export type WebsiteAiSetupResult = {
  websiteId: string;
  setupCompletedAt: string;
  sourceJobs: {
    scope: string;
    sourceType: string;
    sourceId: string;
    status: string;
  }[];
  promotionCount: number;
};

export async function fetchLlmProfiles(): Promise<LlmProfileOption[]> {
  const { data } = await apiClient.get<unknown>("/platform/llm/profiles");
  return unwrapAiKnowledgeData<LlmProfileOption[]>(data);
}

export async function listCopilotWebsites(
  params?: ListCopilotWebsitesParams,
): Promise<ListCopilotWebsitesResult> {
  const { data } = await apiClient.get<unknown>("/ai-training/copilot/websites", {
    params,
  });
  return unwrapAiKnowledgeData<ListCopilotWebsitesResult>(data);
}

export async function fetchWebsiteAiSetup(
  websiteId: string,
): Promise<WebsiteAiSetupState> {
  const { data } = await apiClient.get<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/setup`,
  );
  return unwrapAiKnowledgeData<WebsiteAiSetupState>(data);
}

export async function applyWebsiteAiSetup(
  websiteId: string,
  body: WebsiteAiSetupPayload,
): Promise<WebsiteAiSetupResult> {
  const { data } = await apiClient.post<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/setup`,
    body,
  );
  return unwrapAiKnowledgeData<WebsiteAiSetupResult>(data);
}

export async function applyWebsiteAiTraining(
  websiteId: string,
  body: WebsiteAiTrainingPayload,
): Promise<WebsiteAiSetupResult> {
  const { data } = await apiClient.post<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/training`,
    body,
  );
  return unwrapAiKnowledgeData<WebsiteAiSetupResult>(data);
}

export async function updateWebsiteAiModels(
  websiteId: string,
  body: Partial<Pick<WebsiteAiSetupPayload, "chatbotProfileId" | "copilotProfileId" | "tone">>,
): Promise<WebsiteAiSetupState> {
  const { data } = await apiClient.patch<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/setup/models`,
    body,
  );
  return unwrapAiKnowledgeData<WebsiteAiSetupState>(data);
}
