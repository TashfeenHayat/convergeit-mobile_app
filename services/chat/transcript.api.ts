import { apiClient } from "@/api";
import { normalizeConversationHistoryPayload } from "./conversation-normalizers";
import { unwrapChatHttpData } from "./http";
import type {
  TranscriptDetailResponse,
  TranscriptListFilters,
  TranscriptListItem,
  TranscriptListResponse,
  TranscriptSuggestionItem,
  TranscriptSuggestionKind,
} from "./transcript.types";

function compactTranscriptQuery(
  filters: TranscriptListFilters,
): Record<string, string | number> {
  const q: Record<string, string | number> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 25,
  };
  if (filters.resellerId?.trim()) q.resellerId = filters.resellerId.trim();
  if (filters.parentCompanyId?.trim()) {
    q.parentCompanyId = filters.parentCompanyId.trim();
  }
  if (filters.childCompanyId?.trim()) q.childCompanyId = filters.childCompanyId.trim();
  if (filters.websiteId?.trim()) q.websiteId = filters.websiteId.trim();
  if (filters.conversationId?.trim()) {
    q.conversationId = filters.conversationId.trim();
  }
  if (filters.status?.trim()) q.status = filters.status.trim();
  if (filters.agentId?.trim()) q.agentId = filters.agentId.trim();
  if (filters.searchField?.trim()) q.searchField = filters.searchField.trim();
  if (filters.search?.trim()) q.search = filters.search.trim();
  if (filters.from?.trim()) q.from = filters.from.trim();
  if (filters.to?.trim()) q.to = filters.to.trim();
  return q;
}

function normalizeListItem(raw: unknown): TranscriptListItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = String(o.id ?? "").trim();
  if (!id) return null;
  const participants = Array.isArray(o.participants)
    ? (o.participants as TranscriptListItem["participants"])
    : [];
  return {
    id,
    websiteId: String(o.websiteId ?? ""),
    visitorId: (o.visitorId as string | null) ?? null,
    agentId: (o.agentId as string | null) ?? null,
    status: String(o.status ?? ""),
    routingKey: (o.routingKey as string | null) ?? null,
    serviceChannel: (o.serviceChannel as string | null) ?? null,
    startedAt: o.startedAt ? String(o.startedAt) : undefined,
    endedAt: o.endedAt ? String(o.endedAt) : null,
    messageCount: Number(o.messageCount ?? 0),
    visitorPresentation: o.visitorPresentation as TranscriptListItem["visitorPresentation"],
    lastMessage: (o.lastMessage as Record<string, unknown> | null) ?? null,
    participants,
    reseller: o.reseller as TranscriptListItem["reseller"],
    parentCompany: o.parentCompany as TranscriptListItem["parentCompany"],
    childCompany: o.childCompany as TranscriptListItem["childCompany"],
    website: o.website as TranscriptListItem["website"],
    agent: o.agent as TranscriptListItem["agent"],
    resolvedAgentLabel:
      typeof o.resolvedAgentLabel === "string" ? o.resolvedAgentLabel : null,
    department: o.department as TranscriptListItem["department"],
    pool: o.pool as TranscriptListItem["pool"],
    transcriptStatus:
      typeof o.transcriptStatus === "string" ? o.transcriptStatus : null,
    closeBucket: typeof o.closeBucket === "string" ? o.closeBucket : null,
    closeOutcome: typeof o.closeOutcome === "string" ? o.closeOutcome : null,
    spamCategory: typeof o.spamCategory === "string" ? o.spamCategory : null,
    requiresDistributionForm: Boolean(o.requiresDistributionForm),
    requiresDistributionSetup: Boolean(o.requiresDistributionSetup),
    distributionSubmitted: Boolean(o.distributionSubmitted),
    isMeaningfulChat: Boolean(o.isMeaningfulChat),
  };
}

export async function fetchChatTranscripts(
  filters: TranscriptListFilters = {},
): Promise<TranscriptListResponse> {
  const { data } = await apiClient.get<unknown>("/chat/transcripts", {
    params: compactTranscriptQuery(filters),
  });
  const unwrapped = unwrapChatHttpData<Record<string, unknown>>(data);
  const items = Array.isArray(unwrapped.items)
    ? unwrapped.items
        .map(normalizeListItem)
        .filter((r): r is TranscriptListItem => r !== null)
    : [];
  return {
    items,
    total: Number(unwrapped.total ?? items.length),
    page: Number(unwrapped.page ?? 1),
    limit: Number(unwrapped.limit ?? 25),
    totalPages: Number(unwrapped.totalPages ?? 1),
  };
}

export async function fetchChatTranscriptSuggestions(params: {
  kind: TranscriptSuggestionKind;
  q: string;
  limit?: number;
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  websiteId?: string;
}): Promise<TranscriptSuggestionItem[]> {
  const { data } = await apiClient.get<unknown>("/chat/transcripts/suggestions", {
    params: {
      kind: params.kind,
      q: params.q.trim(),
      limit: params.limit ?? 8,
      ...(params.resellerId ? { resellerId: params.resellerId } : {}),
      ...(params.parentCompanyId ? { parentCompanyId: params.parentCompanyId } : {}),
      ...(params.childCompanyId ? { childCompanyId: params.childCompanyId } : {}),
      ...(params.websiteId ? { websiteId: params.websiteId } : {}),
    },
  });
  const unwrapped = unwrapChatHttpData<{ items?: TranscriptSuggestionItem[] }>(data);
  return Array.isArray(unwrapped.items) ? unwrapped.items : [];
}

export async function fetchChatTranscriptDetail(
  conversationId: string,
): Promise<TranscriptDetailResponse> {
  const { data } = await apiClient.get<unknown>(
    `/chat/transcripts/${encodeURIComponent(conversationId)}`,
  );
  const unwrapped = unwrapChatHttpData<Record<string, unknown>>(data);
  const conv =
    typeof unwrapped.conversation === "object" && unwrapped.conversation !== null
      ? (unwrapped.conversation as Record<string, unknown>)
      : unwrapped;
  const normalized = normalizeConversationHistoryPayload(
    { ...conv, messages: unwrapped.messages },
    conversationId,
  );
  return {
    ...unwrapped,
    conversation: conv,
    conversationId: normalized.conversationId,
    messages: normalized.messages,
    assignments: Array.isArray(unwrapped.assignments) ? unwrapped.assignments : [],
    visitor:
      typeof conv.visitor === "object" && conv.visitor !== null
        ? (conv.visitor as Record<string, unknown>)
        : undefined,
    participants: Array.isArray(unwrapped.participants)
      ? (unwrapped.participants as TranscriptDetailResponse["participants"])
      : [],
    readOnly: true,
  };
}
