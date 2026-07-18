import { apiClient } from "../http/axios-instance";
import type {
  CreateKnowledgeSourceJsonBody,
  CreateKnowledgeSourceResult,
  ListKbTrainingWebsitesParams,
  ListKbTrainingWebsitesResult,
  ListKnowledgeSourceChunksParams,
  ListKnowledgeSourceChunksResult,
  ListKnowledgeSourcesParams,
  ListKnowledgeSourcesResult,
  ReindexBulkResult,
  ReindexKnowledgeBody,
} from "../ai-knowledge/types";
import { unwrapAiKnowledgeData } from "../ai-knowledge/unwrap";

function buildJsonCreatePayload(body: CreateKnowledgeSourceJsonBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sourceType: body.sourceType,
    sourceRef: body.sourceRef,
  };
  const wid = body.websiteId?.trim();
  if (wid) payload.websiteId = wid;
  const title = body.title?.trim();
  if (title) payload.title = title;
  const meta = body.metadataJson?.trim();
  if (meta) payload.metadataJson = meta;
  return payload;
}

export async function postAiChatbotSourceJson(
  body: CreateKnowledgeSourceJsonBody,
): Promise<CreateKnowledgeSourceResult> {
  const { data } = await apiClient.post<unknown>("/ai-chatbot/sources", buildJsonCreatePayload(body));
  return unwrapAiKnowledgeData<CreateKnowledgeSourceResult>(data);
}

export async function listAiChatbotSources(
  params?: ListKnowledgeSourcesParams,
): Promise<ListKnowledgeSourcesResult> {
  const { data } = await apiClient.get<unknown>("/ai-chatbot/sources", { params });
  return unwrapAiKnowledgeData<ListKnowledgeSourcesResult>(data);
}

export async function listAiChatbotTrainingWebsites(
  params?: ListKbTrainingWebsitesParams,
): Promise<ListKbTrainingWebsitesResult> {
  const { data } = await apiClient.get<unknown>("/ai-chatbot/training-websites", { params });
  return unwrapAiKnowledgeData<ListKbTrainingWebsitesResult>(data);
}

export async function listAiChatbotSourceChunks(
  sourceId: string,
  params?: ListKnowledgeSourceChunksParams,
): Promise<ListKnowledgeSourceChunksResult> {
  const { data } = await apiClient.get<unknown>(
    `/ai-chatbot/sources/${encodeURIComponent(sourceId.trim())}/chunks`,
    { params },
  );
  return unwrapAiKnowledgeData<ListKnowledgeSourceChunksResult>(data);
}

export async function deleteAiChatbotSource(sourceId: string): Promise<{ sourceId: string; deleted: boolean }> {
  const { data } = await apiClient.delete<unknown>(
    `/ai-chatbot/sources/${encodeURIComponent(sourceId.trim())}`,
  );
  return unwrapAiKnowledgeData<{ sourceId: string; deleted: boolean }>(data);
}

export async function postAiChatbotReindex(
  body: ReindexKnowledgeBody = {},
): Promise<CreateKnowledgeSourceResult | ReindexBulkResult> {
  const payload: Record<string, unknown> = {};
  const sid = body.sourceId?.trim();
  if (sid) payload.sourceId = sid;
  const wid = body.websiteId?.trim();
  if (wid) payload.websiteId = wid;
  if (body.includeFailed === true) payload.includeFailed = true;

  const { data } = await apiClient.post<unknown>("/ai-chatbot/reindex", payload);
  return unwrapAiKnowledgeData<CreateKnowledgeSourceResult | ReindexBulkResult>(data);
}
