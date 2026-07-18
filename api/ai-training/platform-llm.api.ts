import { apiClient } from "../http/axios-instance";
import { unwrapAiKnowledgeData } from "../ai-knowledge/unwrap";

export type PlatformLlmProvider = {
  id: string;
  code: "GEMINI" | "OPENAI" | "GROQ" | "ANTHROPIC";
  name: string;
  adapterKey: string;
  sortOrder: number;
  supportsEmbedding: boolean;
  keyConfigured: boolean;
  keyId: string | null;
  generationModel: string | null;
  embeddingModel: string | null;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
};

export type AiUsageTotals = {
  promptTokens: number;
  completionTokens: number;
  embeddingTokens: number;
  totalTokens: number;
  requestCount: number;
};

export type AiUsageByProvider = AiUsageTotals & {
  providerId: string | null;
  providerCode: string | null;
  providerName: string | null;
};

export type AiUsageByProfile = AiUsageTotals & {
  profileId: string | null;
  profileName: string | null;
  generationModel: string | null;
};

export type AiUsageSummary = {
  totals: AiUsageTotals;
  byProvider: AiUsageByProvider[];
  byRole: (AiUsageTotals & { agentRole: string | null })[];
  byProfile: AiUsageByProfile[];
  byModel: (AiUsageTotals & { model: string | null })[];
};

export type PlatformLlmProfileDetail = {
  id: string;
  name: string;
  description: string | null;
  generationModel: string;
  embeddingModel: string | null;
  maxOutputTokens: number;
  temperature: number;
  generationProvider: { id: string; code: string; name: string };
  embeddingProvider: { id: string; code: string; name: string } | null;
  usage: AiUsageByProfile | null;
};

export type PlatformAiOverview = {
  configuredProviders: PlatformLlmProvider[];
  allProviderCount: number;
  profiles: PlatformLlmProfileDetail[];
  usage: AiUsageSummary;
};

export type UpsertPlatformLlmKeyPayload = {
  providerCode: "GEMINI" | "OPENAI" | "GROQ" | "ANTHROPIC";
  apiKey?: string;
  generationModel: string;
  embeddingModel?: string;
  baseUrl?: string;
};

export async function fetchPlatformLlmProviders(): Promise<PlatformLlmProvider[]> {
  const { data } = await apiClient.get<unknown>("/platform/llm/providers");
  return unwrapAiKnowledgeData<PlatformLlmProvider[]>(data);
}

export async function fetchPlatformAiOverview(): Promise<PlatformAiOverview> {
  const { data } = await apiClient.get<unknown>("/platform/llm/overview");
  return unwrapAiKnowledgeData<PlatformAiOverview>(data);
}

export async function upsertPlatformLlmKey(
  body: UpsertPlatformLlmKeyPayload,
): Promise<{ providerCode: string; configured: boolean }> {
  const { data } = await apiClient.post<unknown>("/platform/llm/keys", body);
  return unwrapAiKnowledgeData<{ providerCode: string; configured: boolean }>(data);
}

export async function upsertPlatformLlmKeysBatch(
  keys: UpsertPlatformLlmKeyPayload[],
): Promise<{ providerCode: string; configured: boolean }[]> {
  const { data } = await apiClient.post<unknown>("/platform/llm/keys/batch", {
    keys,
  });
  return unwrapAiKnowledgeData<{ providerCode: string; configured: boolean }[]>(
    data,
  );
}
