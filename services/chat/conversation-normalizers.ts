import type {
  AgentVisitorPresentation,
  ConversationHistoryResponse,
  ConversationSummary,
} from "./chat.types";
import type { RawChatMessagePayload } from "./normalize-message";
import { normalizeServerMessage } from "./normalize-message";

export function normalizeConversationSummary(raw: unknown): ConversationSummary {
  if (!raw || typeof raw !== "object") {
    return { id: "", status: "waiting" };
  }
  const o = raw as Record<string, unknown>;
  const id = String(o.conversationId ?? o.id ?? "").trim();
  const websiteId =
    typeof o.websiteId === "string"
      ? o.websiteId
      : typeof o.website_id === "string"
        ? o.website_id
        : undefined;
  const agentIdRaw =
    typeof o.assignedAgentId === "string"
      ? o.assignedAgentId
      : typeof o.agentId === "string"
        ? o.agentId
        : null;
  const assignedAgentId = agentIdRaw?.trim() || null;
  const visitorPresentation =
    typeof o.visitorPresentation === "object" && o.visitorPresentation !== null
      ? (o.visitorPresentation as AgentVisitorPresentation)
      : undefined;
  return {
    ...(o as ConversationSummary),
    id,
    conversationId: id || undefined,
    websiteId,
    ...(assignedAgentId
      ? { assignedAgentId, agentId: assignedAgentId }
      : {}),
    ...(visitorPresentation ? { visitorPresentation } : {}),
  };
}

export function normalizeConversationList(data: unknown): ConversationSummary[] {
  if (!Array.isArray(data)) return [];
  return data.map(normalizeConversationSummary).filter((c) => Boolean(c.id));
}

export function normalizeConversationHistoryPayload(
  data: unknown,
  fallbackConversationId: string,
): ConversationHistoryResponse {
  if (!data || typeof data !== "object") {
    return { conversationId: fallbackConversationId, messages: [] };
  }
  const o = data as Record<string, unknown>;
  const cid = String(o.conversationId ?? o.conversation_id ?? fallbackConversationId);
  let rawMsgs: RawChatMessagePayload[] = [];

  const maybeMessages =
    (Array.isArray(o.messages) && o.messages) ||
    (Array.isArray(o.data) && typeof o.data === "object"
      ? (o.data as { messages?: RawChatMessagePayload[] }).messages
      : undefined);

  rawMsgs =
    maybeMessages ??
    ([] as RawChatMessagePayload[]);

  const messages = rawMsgs
    .map((m) =>
      normalizeServerMessage({
        ...m,
        conversationId:
          (m as Record<string, unknown>).conversationId ??
          (m as Record<string, unknown>).conversation_id ??
          cid,
      }),
    )
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const visitor =
    typeof o.visitor === "object" && o.visitor !== null
      ? (o.visitor as Record<string, unknown>)
      : undefined;

  return {
    ...o,
    conversationId: cid,
    messages,
    ...(visitor ? { visitor } : {}),
  };
}
