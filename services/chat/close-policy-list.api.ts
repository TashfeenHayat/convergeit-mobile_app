import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type { ClosePolicyListRow, ListClosePoliciesQuery } from "./close-policy-list.types";

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

function readBool(v: unknown): boolean {
  return v === true;
}

function readNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeClosePolicy(raw: unknown): ClosePolicyListRow["closePolicy"] {
  const cp = asRecord(raw) ?? {};
  const vi = asRecord(cp.visitorIdle) ?? {};
  const anr = asRecord(cp.agentNoResponse) ?? {};
  const sc = asRecord(cp.supervisorClose) ?? {};
  return {
    enabled: readBool(cp.enabled),
    visitorIdle: {
      enabled: readBool(vi.enabled),
      nudgeAfterMinutes: readNum(vi.nudgeAfterMinutes, 8),
      closeAfterMinutes: readNum(vi.closeAfterMinutes, 10),
    },
    agentNoResponse: {
      enabled: readBool(anr.enabled),
      firstAlertAgentAfterMinutes: readNum(anr.firstAlertAgentAfterMinutes, 2),
      fallbackToVisitorAfterMinutes: readNum(anr.fallbackToVisitorAfterMinutes, 5),
      closeAfterMinutes: readNum(anr.closeAfterMinutes, 20),
    },
    supervisorClose: {
      enabled: readBool(sc.enabled),
      requireReason: readBool(sc.requireReason),
    },
  };
}

function normalizeListRow(raw: unknown): ClosePolicyListRow | null {
  const row = asRecord(raw);
  if (!row) return null;
  const websiteId = pickString(row, ["websiteId", "website_id"]);
  if (!websiteId) return null;

  return {
    websiteId,
    websiteName: pickString(row, ["websiteName", "website_name", "name"]) || undefined,
    websiteUrl: pickString(row, ["websiteUrl", "website_url", "url"]) || undefined,
    resellerName: pickString(row, ["resellerName", "reseller_name"]) || undefined,
    resellerId: pickString(row, ["resellerId", "reseller_id"]) || undefined,
    parentCompanyName: pickString(row, ["parentCompanyName", "parent_company_name"]) || undefined,
    parentCompanyId: pickString(row, ["parentCompanyId", "parent_company_id"]) || undefined,
    childCompanyName: pickString(row, ["childCompanyName", "child_company_name"]) || undefined,
    childCompanyId: pickString(row, ["childCompanyId", "child_company_id"]) || undefined,
    hasCustomSettings: row.hasCustomSettings === true,
    updatedAt:
      typeof row.updatedAt === "string"
        ? row.updatedAt
        : row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : null,
    closePolicy: normalizeClosePolicy(row.closePolicy),
  };
}

function extractList(payload: unknown): unknown[] {
  const data = unwrapChatHttpData<unknown>(payload);
  if (Array.isArray(data)) return data;
  const rec = asRecord(data);
  if (!rec) return [];
  if (Array.isArray(rec.items)) return rec.items;
  return [];
}

export async function listClosePolicies(
  query: ListClosePoliciesQuery = {},
): Promise<ClosePolicyListRow[]> {
  const { data } = await apiClient.get<unknown>("/chat/settings/close-policies", {
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
    .filter((r): r is ClosePolicyListRow => r !== null);
}
