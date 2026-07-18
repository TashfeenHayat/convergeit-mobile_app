import { isAxiosError } from "axios";
import { apiClient } from "@/api";
import {
  agentChatSocketAckOrRest,
  agentChatSocketAckRequired,
  ensureAgentChatSocketReady,
} from "./agent-socket-api.util";
import { unwrapSocketAckPayload } from "@/lib/hooks/chat/chat-socket-delivery";
import {
  isSocketTransportError,
  isVisitorProfileBusinessError,
} from "@/features/chat-operations/utils/visitor-profile-capture";
import type {
  AgentSendMessagePayload,
  AgentVisitorProfileUpdateResult,
  ChatCloseResponse,
  ConversationHistoryResponse,
  ConversationSummary,
  PatchAgentVisitorProfileBody,
  VisitorCreateConversationPayload,
  VisitorCreateConversationResponse,
  VisitorSendMessagePayload,
} from "./chat.types";
import {
  normalizeConversationHistoryPayload,
  normalizeConversationList,
} from "./conversation-normalizers";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import {
  VisitorProfileConflictError,
  type PatchVisitorProfileBody,
  type PatchVisitorProfileResult,
  type VisitorProfileField,
} from "./visitor-profile.types";

function readVisitorProfileConflict(
  payload: unknown,
): { message: string; field: VisitorProfileField; currentValue: string } | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const err =
    root.error && typeof root.error === "object"
      ? (root.error as Record<string, unknown>)
      : root;
  const code = typeof err.code === "string" ? err.code : "";
  if (code !== "VISITOR_FIELD_ALREADY_SET") return null;
  const message =
    typeof err.message === "string" && err.message.trim()
      ? err.message.trim()
      : "This field is already set.";
  const details =
    err.details && typeof err.details === "object"
      ? (err.details as Record<string, unknown>)
      : null;
  const fieldRaw = typeof details?.field === "string" ? details.field : "";
  const field: VisitorProfileField | null =
    fieldRaw === "name" || fieldRaw === "email" || fieldRaw === "phone" ? fieldRaw : null;
  if (!field) return null;
  const currentValue =
    typeof details?.currentValue === "string" ? details.currentValue : "";
  return { message, field, currentValue };
}

/** @deprecated Use `createWidgetConversation` from `widget-visitor.api` (no dashboard session side effects). */
export async function createConversation(
  payload: VisitorCreateConversationPayload,
): Promise<VisitorCreateConversationResponse> {
  const { createWidgetConversation } = await import("./widget-visitor.api");
  return createWidgetConversation(payload);
}

/** @deprecated Use `sendWidgetVisitorMessage` from `widget-visitor.api`. */
export async function sendVisitorMessage(
  conversationId: string,
  payload: VisitorSendMessagePayload,
): Promise<unknown> {
  const { sendWidgetVisitorMessage } = await import("./widget-visitor.api");
  return sendWidgetVisitorMessage(conversationId, payload);
}

export async function sendAgentMessage(
  conversationId: string,
  payload: AgentSendMessagePayload,
  token?: string,
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/messages`,
    payload,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData(data);
}

export interface ChatTransferTarget {
  userId: string;
  name: string;
  email: string | null;
  userType: "Internal" | "External";
  departmentId: string | null;
  departmentName: string | null;
  assignmentType: string;
  serviceChannel: string;
  label: string;
}

export interface ChatTransferTargetsResponse {
  conversationId: string;
  agents: ChatTransferTarget[];
}

export interface TransferConversationResponse {
  conversationId: string;
  transfer: {
    conversationId: string;
    fromAgentId: string;
    toAgentId: string;
  };
  fromAgent: { id: string; label: string };
  toAgent: { id: string; label: string };
  assignedRank?: string | null;
  lastTransferFrom?: {
    userId: string;
    label: string;
    transferredAt?: string;
  } | null;
}

/** @deprecated Use transferConversation instead. */
export interface TransferToPoolHeadResponse extends TransferConversationResponse {}

export async function fetchConversationTransferTargets(
  conversationId: string,
  token?: string,
): Promise<ChatTransferTargetsResponse> {
  const { data } = await apiClient.get<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/transfer-targets`,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<ChatTransferTargetsResponse>(data);
}

export async function transferConversation(
  conversationId: string,
  toUserId: string,
  token?: string,
): Promise<TransferConversationResponse> {
  return agentChatSocketAckOrRest<TransferConversationResponse>(
    (socket) =>
      socket.transferConversationWithAck({ conversationId, toUserId }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/agent/conversations/${encodeURIComponent(conversationId)}/transfer`,
        { toUserId },
        { headers: chatAuthHeaders(token) },
      );
      return unwrapChatHttpData<TransferConversationResponse>(data);
    },
  );
}

/** @deprecated Use transferConversation instead. */
export async function transferConversationToPoolHead(
  conversationId: string,
  _token?: string,
): Promise<TransferToPoolHeadResponse> {
  return agentChatSocketAckRequired<TransferToPoolHeadResponse>(
    (socket) => socket.transferToPoolHeadWithAck({ conversationId }, 15_000),
    "transfer to pool head",
  );
}

export async function getAgentConversationHistorySocket(
  conversationId: string,
): Promise<ConversationHistoryResponse> {
  const payload = await agentChatSocketAckRequired<unknown>(
    (socket) => socket.fetchAgentHistoryWithAck({ conversationId }, 15_000),
    "load conversation history",
  );
  return normalizeConversationHistoryPayload(payload, conversationId);
}

export function isConversationAlreadyClosedError(err: unknown): boolean {
  if (isAxiosError(err) && err.response?.status === 400) {
    const data = err.response.data;
    const text =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "message" in data
          ? String((data as { message?: unknown }).message ?? "")
          : "";
    if (text.toLowerCase().includes("already closed")) return true;
  }
  const msg =
    err && typeof err === "object"
      ? String((err as { message?: unknown }).message ?? err)
      : String(err ?? "");
  const lower = msg.toLowerCase();
  return lower.includes("already closed") || lower.includes("conversation is closed");
}

export async function closeConversation(
  conversationId: string,
  token?: string,
): Promise<ChatCloseResponse> {
  try {
    const { data } = await apiClient.post<unknown>(
      `/chat/agent/conversations/${encodeURIComponent(conversationId)}/close`,
      undefined,
      { headers: chatAuthHeaders(token) },
    );
    return unwrapChatHttpData<ChatCloseResponse>(data);
  } catch (err) {
    if (isConversationAlreadyClosedError(err)) {
      return { conversationId, reassigned: null };
    }
    throw err;
  }
}

export async function markConversationSpam(
  conversationId: string,
  body: { spamCategory: string; notes?: string },
  token?: string,
): Promise<ChatCloseResponse> {
  const { data } = await apiClient.post<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/mark-spam`,
    body,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<ChatCloseResponse>(data);
}

export async function markClosedConversationSpam(
  conversationId: string,
  body: { spamCategory: string; notes?: string },
  token?: string,
): Promise<{ conversationId: string; closeOutcome?: string }> {
  const { data } = await apiClient.post<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/mark-spam-from-form`,
    body,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData(data);
}

export async function getConversationHistory(
  conversationId: string,
  token?: string,
): Promise<ConversationHistoryResponse> {
  const payload = await agentChatSocketAckOrRest<unknown>(
    (socket) => socket.fetchAgentHistoryWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/chat/agent/conversations/${encodeURIComponent(conversationId)}/history`,
        { headers: chatAuthHeaders(token) },
      );
      return unwrapChatHttpData(data);
    },
  );
  return normalizeConversationHistoryPayload(payload, conversationId);
}

export async function getMyActiveChats(token?: string): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<unknown>("/chat/agent/me/active", {
    headers: chatAuthHeaders(token),
  });
  return normalizeConversationList(unwrapChatHttpData(data));
}

export async function getWaitingChats(token?: string): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<unknown>("/chat/agent/waiting", {
    headers: chatAuthHeaders(token),
  });
  return normalizeConversationList(unwrapChatHttpData(data));
}

export async function getMyClosedChats(token?: string): Promise<ConversationSummary[]> {
  const { data } = await apiClient.get<unknown>("/chat/agent/me/closed", {
    headers: chatAuthHeaders(token),
  });
  return normalizeConversationList(unwrapChatHttpData(data));
}

export async function postAgentWebsiteAvailabilityCheck(
  websiteId: string,
  token?: string,
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `/chat/agent/websites/${encodeURIComponent(websiteId)}/availability-check`,
    undefined,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData(data);
}

export async function patchAgentVisitorProfile(
  conversationId: string,
  body: PatchVisitorProfileBody,
  token?: string,
): Promise<PatchVisitorProfileResult> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/chat/agent/conversations/${encodeURIComponent(conversationId)}/visitor-profile`,
      body,
      { headers: chatAuthHeaders(token) },
    );
    return unwrapChatHttpData<PatchVisitorProfileResult>(data);
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 409) {
      const conflict = readVisitorProfileConflict(err.response.data);
      if (conflict) {
        throw new VisitorProfileConflictError(
          conflict.message,
          conflict.field,
          conflict.currentValue,
        );
      }
    }
    throw err;
  }
}
