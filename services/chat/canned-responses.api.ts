import { apiClient } from "@/api";
import { isAxiosError } from "axios";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import type {
  CannedResponseItem,
  CannedResponseListRow,
  ListCannedResponsesQuery,
  ReplaceWebsiteCannedBody,
  WebsiteCannedResponsesBundle,
} from "./canned-responses.types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  const website = asRecord(row.website);
  if (website) {
    for (const key of keys) {
      const v = website[key];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}

function normalizeListRow(raw: unknown): CannedResponseListRow | null {
  const row = asRecord(raw);
  if (!row) return null;

  const websiteId = pickString(row, ["websiteId", "website_id"]);
  const title = String(row.title ?? "").trim();
  const body = String(row.body ?? "").trim();
  if (!websiteId || (!title && !body)) return null;

  return {
    id: String(row.id ?? `${websiteId}-${title}-${body.slice(0, 12)}`),
    websiteId,
    title,
    body,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    websiteName: pickString(row, ["websiteName", "website_name", "name"]) || undefined,
    websiteUrl: pickString(row, ["websiteUrl", "website_url", "url"]) || undefined,
    resellerName: pickString(row, ["resellerName", "reseller_name"]) || undefined,
    childCompanyName: pickString(row, ["childCompanyName", "child_company_name"]) || undefined,
    parentCompanyName: pickString(row, ["parentCompanyName", "parent_company_name"]) || undefined,
    resellerId: pickString(row, ["resellerId", "reseller_id"]) || undefined,
    childCompanyId: pickString(row, ["childCompanyId", "child_company_id"]) || undefined,
    parentCompanyId: pickString(row, ["parentCompanyId", "parent_company_id"]) || undefined,
  };
}

function normalizeItem(raw: unknown, websiteId: string): CannedResponseItem | null {
  const row = asRecord(raw);
  if (!row) return null;
  const title = String(row.title ?? "").trim();
  const body = String(row.body ?? "").trim();
  if (!title || !body) return null;
  return {
    id: row.id != null ? String(row.id) : undefined,
    title,
    body,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
  };
}

function extractList(payload: unknown): unknown[] {
  const data = unwrapChatHttpData<unknown>(payload);
  if (Array.isArray(data)) return data;
  const rec = asRecord(data);
  if (!rec) return [];
  if (Array.isArray(rec.items)) return rec.items;
  if (Array.isArray(rec.rows)) return rec.rows;
  if (Array.isArray(rec.data)) return rec.data;
  return [];
}

function isPermissionDeniedError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 401 || status === 403) return true;
  const data = error.response?.data;
  const msg =
    typeof data === "object" && data && "message" in data
      ? String((data as { message?: unknown }).message ?? "")
      : "";
  return /insufficient|permission|forbidden/i.test(msg);
}

/** Legacy agent inbox endpoint (pre–canned-responses module). */
async function fetchAgentCannedResponsesLegacy(
  websiteId: string,
  token?: string,
): Promise<CannedResponseItem[]> {
  const { data } = await apiClient.get<unknown>("/chat/agent/canned-responses", {
    params: { websiteId: websiteId.trim() },
    headers: chatAuthHeaders(token),
  });
  const rows = extractList(data);
  return rows
    .map((r) => normalizeItem(r, websiteId))
    .filter((i): i is CannedResponseItem => i !== null)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export async function listCannedResponses(
  query: ListCannedResponsesQuery = {},
): Promise<CannedResponseListRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/canned-responses", {
    params: {
      all: query.all ?? true,
      resellerId: query.resellerId?.trim() || undefined,
      childCompanyId: query.childCompanyId?.trim() || undefined,
      parentCompanyId: query.parentCompanyId?.trim() || undefined,
      websiteId: query.websiteId?.trim() || undefined,
      search: query.search?.trim() || undefined,
    },
  });
  return extractList(data)
    .map(normalizeListRow)
    .filter((r): r is CannedResponseListRow => r !== null);
}

export async function fetchWebsiteCannedResponses(
  websiteId: string,
): Promise<WebsiteCannedResponsesBundle> {
  const { data } = await apiClient.get<unknown>(
    `/chat/canned-responses/websites/${encodeURIComponent(websiteId)}`,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  const rec = asRecord(raw) ?? {};
  const itemsRaw = Array.isArray(rec.items)
    ? rec.items
    : Array.isArray(raw)
      ? raw
      : [];

  const items = itemsRaw
    .map((item) => normalizeItem(item, websiteId))
    .filter((i): i is CannedResponseItem => i !== null);

  return {
    websiteId: pickString(rec, ["websiteId", "website_id"]) || websiteId,
    websiteName: pickString(rec, ["websiteName", "website_name", "name"]) || undefined,
    websiteUrl: pickString(rec, ["websiteUrl", "website_url", "url"]) || undefined,
    resellerName: pickString(rec, ["resellerName", "reseller_name"]) || undefined,
    childCompanyName: pickString(rec, ["childCompanyName", "child_company_name"]) || undefined,
    parentCompanyName: pickString(rec, ["parentCompanyName", "parent_company_name"]) || undefined,
    parentCompanyId: pickString(rec, ["parentCompanyId", "parent_company_id"]) || undefined,
    childCompanyId: pickString(rec, ["childCompanyId", "child_company_id"]) || undefined,
    resellerId: pickString(rec, ["resellerId", "reseller_id"]) || undefined,
    items,
  };
}

export async function replaceWebsiteCannedResponses(
  websiteId: string,
  body: ReplaceWebsiteCannedBody,
): Promise<WebsiteCannedResponsesBundle> {
  const { data } = await apiClient.put<unknown>(
    `/chat/canned-responses/websites/${encodeURIComponent(websiteId)}`,
    body,
  );
  unwrapChatHttpData<unknown>(data);
  return fetchWebsiteCannedResponses(websiteId);
}

export async function fetchAgentCannedResponses(
  websiteId: string,
  token?: string,
): Promise<CannedResponseItem[]> {
  try {
    const { data } = await apiClient.get<unknown>("/chat/canned-responses/agent", {
      params: { websiteId: websiteId.trim() },
      headers: chatAuthHeaders(token),
    });
    const rows = extractList(data);
    return rows
      .map((r) => normalizeItem(r, websiteId))
      .filter((i): i is CannedResponseItem => i !== null)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return fetchAgentCannedResponsesLegacy(websiteId, token);
    }
    throw error;
  }
}
