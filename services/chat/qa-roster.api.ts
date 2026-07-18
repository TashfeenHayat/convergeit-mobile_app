import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type { ChatScopeListQuery } from "./involvement-list.types";

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

export type QaRosterListRow = {
  id: string;
  websiteId: string;
  userId: string;
  channelScope: "internal" | "external";
  user?: {
    id: string;
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    userType?: string;
  };
  website: {
    websiteId: string;
    websiteName: string | null;
    websiteUrl: string;
    childCompanyId: string;
    childCompanyName: string;
    parentCompanyId: string;
    parentCompanyName: string;
    resellerId: string;
    resellerName: string;
  };
};

function normalizeQaListRow(raw: unknown): QaRosterListRow | null {
  const row = asRecord(raw);
  if (!row) return null;
  const websiteId = String(row.websiteId ?? "").trim();
  const userId = String(row.userId ?? "").trim();
  if (!websiteId || !userId) return null;
  const channel = String(row.channelScope ?? "").trim().toLowerCase();
  const web = asRecord(row.website) ?? {};
  return {
    id: String(row.id ?? `${websiteId}-${userId}-${channel}`),
    websiteId,
    userId,
    channelScope: channel === "external" ? "external" : "internal",
    user: row.user as QaRosterListRow["user"],
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

export async function listQaRosterInScope(
  query: ChatScopeListQuery = {},
): Promise<QaRosterListRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/qa/roster", {
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
    .map(normalizeQaListRow)
    .filter((r): r is QaRosterListRow => r !== null);
}

export type QaRosterPoolRef = { id: string; name: string };

export type QaRosterUser = {
  userId: string;
  poolId?: string | null;
  pool?: QaRosterPoolRef | null;
  user?: { id: string; email?: string; firstName?: string | null; lastName?: string | null };
};

export type QaInternalRosterEntry = { userId: string; poolId: string };

export type QaRosterResponse = {
  websiteId: string;
  userIds: string[];
  internal: QaRosterUser[];
  external: QaRosterUser[];
};

function mapRoster(raw: unknown, websiteId: string): QaRosterResponse {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const mapList = (key: string): QaRosterUser[] => {
    const arr = Array.isArray(o[key]) ? (o[key] as unknown[]) : [];
    return arr
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const userId = String(r.userId ?? "").trim();
        if (!userId) return null;
        return {
          userId,
          poolId: r.poolId != null ? String(r.poolId) : null,
          pool: r.pool as QaRosterUser["pool"],
          user: r.user as QaRosterUser["user"],
        };
      })
      .filter((x) => x != null) as QaRosterUser[];
  };
  const internal = mapList("internal");
  const external = mapList("external");
  const userIds = Array.isArray(o.userIds)
    ? (o.userIds as string[]).map(String)
    : [...internal, ...external].map((r) => r.userId);
  return { websiteId, userIds, internal, external };
}

export type QaWebsiteRosterExclusions = {
  websiteId: string;
  chatAgentUserIds: string[];
  qaReviewerUserIds: string[];
};

export async function fetchQaWebsiteRosterExclusions(
  websiteId: string,
): Promise<QaWebsiteRosterExclusions> {
  const { data } = await apiClient.get<unknown>(
    `/chat/qa/websites/${encodeURIComponent(websiteId)}/roster-exclusions`,
  );
  const raw = unwrapChatHttpData<Record<string, unknown>>(data);
  const chatAgentUserIds = Array.isArray(raw.chatAgentUserIds)
    ? (raw.chatAgentUserIds as unknown[]).map((id) => String(id).trim()).filter(Boolean)
    : [];
  const qaReviewerUserIds = Array.isArray(raw.qaReviewerUserIds)
    ? (raw.qaReviewerUserIds as unknown[]).map((id) => String(id).trim()).filter(Boolean)
    : [];
  return {
    websiteId: String(raw.websiteId ?? websiteId),
    chatAgentUserIds,
    qaReviewerUserIds,
  };
}

export async function fetchQaWebsiteRoster(websiteId: string): Promise<QaRosterResponse> {
  const { data } = await apiClient.get<unknown>(
    `/chat/qa/websites/${encodeURIComponent(websiteId)}/roster`,
  );
  return mapRoster(unwrapChatHttpData(data), websiteId);
}

export async function saveQaWebsiteRoster(
  websiteId: string,
  body: {
    internalAssignments?: QaInternalRosterEntry[];
    internalUserIds?: string[];
    externalUserIds: string[];
  },
): Promise<QaRosterResponse> {
  const { data } = await apiClient.put<unknown>(
    `/chat/qa/websites/${encodeURIComponent(websiteId)}/roster`,
    body,
  );
  return mapRoster(unwrapChatHttpData(data), websiteId);
}
