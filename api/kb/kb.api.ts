import { apiClient } from "../http/axios-instance";

export type KbSourceType = "FAQ" | "URL" | "PDF" | "WEB_CRAWL" | "SITEMAP" | string;

/** POST /kb/sources — JSON body (CreateKbSourceDto). Omit empty optional fields. */
export interface CreateKbSourceBody {
  websiteId?: string;
  sourceType: KbSourceType;
  sourceRef: string;
  title?: string;
  /** Must be a valid JSON string when sent (validator @IsJSON()). */
  metadataJson?: string;
}

export interface UploadKbSourceParams {
  websiteId: string;
  sourceType: KbSourceType;
  sourceRef: string;
  title: string;
  metadataJson: string;
  /** File attachment when required by source type (e.g. PDF upload). */
  file?: Blob | File | null;
}

/** Unwrap `{ success, data }` envelopes from KB controllers. */
export function unwrapKbResponse(payload: unknown): unknown {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return payload;
  }
  const o = payload as Record<string, unknown>;
  if (
    (o.success === true || o.success === "true") &&
    "data" in o &&
    o.data !== null &&
    typeof o.data === "object"
  ) {
    return o.data;
  }
  return payload;
}

export async function postKbSourceJson(body: CreateKbSourceBody): Promise<unknown> {
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

  const { data } = await apiClient.post<unknown>("/kb/sources", payload);
  return data;
}

export async function postKbSourceMultipart(
  params: UploadKbSourceParams,
): Promise<unknown> {
  const formData = new FormData();
  formData.append("websiteId", params.websiteId);
  formData.append("sourceType", params.sourceType);
  formData.append("sourceRef", params.sourceRef);
  formData.append("title", params.title);
  formData.append("metadataJson", params.metadataJson ?? "{}");

  if (params.file instanceof Blob) {
    formData.append("file", params.file);
  }

  const { data } = await apiClient.post<unknown>("/kb/sources", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export interface KbReindexBody {
  /** When set, only this source is re-ingested. */
  sourceId?: string;
  /** When true without sourceId, eligible sources include previously failed rows. */
  includeFailed?: boolean;
}

export async function postKbReindex(body: KbReindexBody): Promise<unknown> {
  const payload: Record<string, unknown> = {};
  const sid = body.sourceId?.trim();
  if (sid) payload.sourceId = sid;
  if (body.includeFailed === true) payload.includeFailed = true;

  const { data } = await apiClient.post<unknown>("/kb/reindex", payload);
  return data;
}
