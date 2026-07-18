import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";

export type QaPolicy = {
  enabled: boolean;
  autoAssignOnClose: boolean;
  autoAssignOnTakeover: boolean;
  notifyAssignedQaOnTakeover: boolean;
  externalCanSeeWhispers: boolean;
  assignMode: "least_pending" | "round_robin";
  internalAssignScope: "website" | "pool";
  reviewSlaHours: number | null;
};

export type UpsertQaPolicyBody = Partial<QaPolicy>;

export type QaPolicyScopeQuery = {
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
};

export type GlobalQaPolicyView = {
  policy: QaPolicy;
  websiteCount: number;
  enabledWebsiteCount: number;
  mixed: boolean;
};

export type GlobalQaPolicyApplyResult = {
  policy: QaPolicy;
  appliedWebsiteCount: number;
  backfilledReviewCount: number;
};

function scopeParams(query: QaPolicyScopeQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.resellerId?.trim()) params.resellerId = query.resellerId.trim();
  if (query.parentCompanyId?.trim()) {
    params.parentCompanyId = query.parentCompanyId.trim();
  }
  if (query.childCompanyId?.trim()) {
    params.childCompanyId = query.childCompanyId.trim();
  }
  return params;
}

export async function fetchGlobalQaPolicy(
  query: QaPolicyScopeQuery = {},
): Promise<GlobalQaPolicyView> {
  const { data } = await apiClient.get<unknown>("/chat/qa/policy", {
    params: scopeParams(query),
  });
  return unwrapChatHttpData<GlobalQaPolicyView>(data);
}

export async function saveGlobalQaPolicy(
  query: QaPolicyScopeQuery,
  body: UpsertQaPolicyBody,
): Promise<GlobalQaPolicyApplyResult> {
  const { data } = await apiClient.put<unknown>("/chat/qa/policy", body, {
    params: scopeParams(query),
  });
  return unwrapChatHttpData<GlobalQaPolicyApplyResult>(data);
}
