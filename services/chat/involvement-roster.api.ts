import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type { ChatScopeListQuery, InvolvementListRow } from "./involvement-list.types";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function extractItems(payload: unknown): unknown[] {
  const raw = unwrapChatHttpData<unknown>(payload);
  if (Array.isArray(raw)) return raw;
  const rec = asRecord(raw);
  if (rec && Array.isArray(rec.items)) return rec.items;
  return [];
}

function normalizeListRow(raw: unknown): InvolvementListRow | null {
  const row = asRecord(raw);
  if (!row) return null;
  const websiteId = String(row.websiteId ?? "").trim();
  const departmentId = String(row.departmentId ?? "").trim();
  const userId = String(row.userId ?? "").trim();
  if (!websiteId || !departmentId || !userId) return null;
  const web = asRecord(row.website) ?? {};
  const user = asRecord(row.user) ?? {};
  return {
    id: String(row.id ?? `${websiteId}-${departmentId}-${userId}`),
    websiteId,
    departmentId,
    userId,
    sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : 0,
    departmentName: String(row.departmentName ?? "").trim() || "Department",
    departmentType: String(row.departmentType ?? "External").trim(),
    user: {
      id: String(user.id ?? userId),
      email: String(user.email ?? "").trim(),
      name: String(user.name ?? "").trim(),
      userType: String(user.userType ?? "").trim(),
    },
    website: {
      websiteId: String(web.websiteId ?? websiteId),
      websiteName: web.websiteName != null ? String(web.websiteName) : null,
      websiteUrl: String(web.websiteUrl ?? ""),
      childCompanyId: String(web.childCompanyId ?? ""),
      childCompanyName: String(web.childCompanyName ?? ""),
      parentCompanyId: String(web.parentCompanyId ?? ""),
      parentCompanyName: String(web.parentCompanyName ?? ""),
      resellerId: String(web.resellerId ?? ""),
      resellerName: String(web.resellerName ?? ""),
    },
  };
}

export async function listInvolvementUsersInScope(
  query: ChatScopeListQuery = {},
): Promise<InvolvementListRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/involvement/users", {
    params: {
      all: query.all ?? true,
      resellerId: query.resellerId?.trim() || undefined,
      parentCompanyId: query.parentCompanyId?.trim() || undefined,
      childCompanyId: query.childCompanyId?.trim() || undefined,
      websiteId: query.websiteId?.trim() || undefined,
      search: query.search?.trim() || undefined,
    },
  });
  return extractItems(data)
    .map(normalizeListRow)
    .filter((r): r is InvolvementListRow => r !== null);
}

export type InvolvementUserRow = {
  id: string;
  websiteId: string;
  departmentId: string;
  userId: string;
  sortOrder: number;
  department?: { id: string; name: string; type?: string };
  user?: {
    id: string;
    email: string;
    name: string;
    userType: string;
    departmentId: string | null;
  };
};

export async function fetchInvolvementUsers(
  websiteId: string,
): Promise<InvolvementUserRow[]> {
  const { data } = await apiClient.get<unknown>(
    `/chat/involvement/websites/${encodeURIComponent(websiteId)}/users`,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  return Array.isArray(raw) ? (raw as InvolvementUserRow[]) : [];
}

export type ReplaceInvolvementUsersBody = {
  items: Array<{ departmentId: string; userId: string; sortOrder?: number }>;
};

export async function saveInvolvementUsers(
  websiteId: string,
  body: ReplaceInvolvementUsersBody,
): Promise<InvolvementUserRow[]> {
  const { data } = await apiClient.put<unknown>(
    `/chat/involvement/websites/${encodeURIComponent(websiteId)}/users`,
    body,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  return Array.isArray(raw) ? (raw as InvolvementUserRow[]) : [];
}
