import { apiClient } from "../http/axios-instance";
import type {
  AssistantSourceType,
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

export async function postAiAssistantKbSourceJson(
  body: CreateKnowledgeSourceJsonBody,
): Promise<CreateKnowledgeSourceResult> {
  const { data } = await apiClient.post<unknown>(
    "/ai-assistant/kb/sources",
    buildJsonCreatePayload(body),
  );
  return unwrapAiKnowledgeData<CreateKnowledgeSourceResult>(data);
}

export type UploadAssistantKbSourceParams = {
  websiteId: string;
  sourceType: AssistantSourceType;
  title?: string;
  metadataJson?: string;
  file: File;
};

export async function postAiAssistantKbSourceMultipart(
  params: UploadAssistantKbSourceParams,
): Promise<CreateKnowledgeSourceResult> {
  const formData = new FormData();
  formData.append("websiteId", params.websiteId.trim());
  formData.append("sourceType", params.sourceType);
  if (params.sourceType === "DOCX") {
    formData.append("docx", params.file);
  } else {
    formData.append("file", params.file);
  }
  const title = params.title?.trim();
  if (title) formData.append("title", title);
  const meta = params.metadataJson?.trim();
  if (meta) formData.append("metadataJson", meta);

  const { data } = await apiClient.post<unknown>("/ai-assistant/kb/sources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return unwrapAiKnowledgeData<CreateKnowledgeSourceResult>(data);
}

export async function listAiAssistantKbSources(
  params?: ListKnowledgeSourcesParams,
): Promise<ListKnowledgeSourcesResult> {
  const { data } = await apiClient.get<unknown>("/ai-assistant/kb/sources", { params });
  return unwrapAiKnowledgeData<ListKnowledgeSourcesResult>(data);
}

export async function listAiAssistantKbTrainingWebsites(
  params?: ListKbTrainingWebsitesParams,
): Promise<ListKbTrainingWebsitesResult> {
  const { data } = await apiClient.get<unknown>("/ai-assistant/kb/training-websites", {
    params,
  });
  return unwrapAiKnowledgeData<ListKbTrainingWebsitesResult>(data);
}

export async function listAiAssistantKbSourceChunks(
  sourceId: string,
  params?: ListKnowledgeSourceChunksParams,
): Promise<ListKnowledgeSourceChunksResult> {
  const { data } = await apiClient.get<unknown>(
    `/ai-assistant/kb/sources/${encodeURIComponent(sourceId.trim())}/chunks`,
    { params },
  );
  return unwrapAiKnowledgeData<ListKnowledgeSourceChunksResult>(data);
}

export async function deleteAiAssistantKbSource(
  sourceId: string,
): Promise<{ sourceId: string; deleted: boolean }> {
  const { data } = await apiClient.delete<unknown>(
    `/ai-assistant/kb/sources/${encodeURIComponent(sourceId.trim())}`,
  );
  return unwrapAiKnowledgeData<{ sourceId: string; deleted: boolean }>(data);
}

export async function postAiAssistantKbReindex(
  body: ReindexKnowledgeBody = {},
): Promise<CreateKnowledgeSourceResult | ReindexBulkResult> {
  const payload: Record<string, unknown> = {};
  const sid = body.sourceId?.trim();
  if (sid) payload.sourceId = sid;
  const wid = body.websiteId?.trim();
  if (wid) payload.websiteId = wid;
  if (body.includeFailed === true) payload.includeFailed = true;

  const { data } = await apiClient.post<unknown>("/ai-assistant/kb/reindex", payload);
  return unwrapAiKnowledgeData<CreateKnowledgeSourceResult | ReindexBulkResult>(data);
}
