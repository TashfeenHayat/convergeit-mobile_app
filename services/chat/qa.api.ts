import { apiClient } from "@/api/http/axios-instance";
import {
  agentChatSocketAckOrRest,
  agentChatSocketAckRequired,
} from "./agent-socket-api.util";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import type {
  QaQueueFilters,
  QaQueueRow,
  QaReviewBundle,
  UpsertQaMessageAnnotationBody,
  UpsertQaSessionReviewBody,
} from "./qa.types";

function queueSocketPayload(filters: QaQueueFilters): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (filters.status) payload.status = filters.status;
  if (filters.websiteId) payload.websiteId = filters.websiteId;
  if (filters.departmentId) payload.departmentId = filters.departmentId;
  if (filters.agentId) payload.agentId = filters.agentId;
  if (filters.hasTakeover) payload.hasTakeover = true;
  return payload;
}

function queueQueryParams(filters: QaQueueFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.status) params.status = filters.status;
  if (filters.websiteId) params.websiteId = filters.websiteId;
  if (filters.departmentId) params.departmentId = filters.departmentId;
  if (filters.agentId) params.agentId = filters.agentId;
  if (filters.hasTakeover) params.hasTakeover = "true";
  return params;
}

export async function fetchQaMyQueue(
  filters: QaQueueFilters = {},
  token?: string,
): Promise<QaQueueRow[]> {
  return agentChatSocketAckOrRest(
    (socket) => socket.sendFetchQaQueueWithAck(queueSocketPayload(filters)),
    async () => {
      const { data } = await apiClient.get<unknown>("/chat/qa/me/queue", {
        params: queueQueryParams(filters),
        headers: chatAuthHeaders(token),
      });
      const rows = unwrapChatHttpData<unknown>(data);
      return Array.isArray(rows) ? (rows as QaQueueRow[]) : [];
    },
  );
}

export async function fetchQaReviewBundle(
  conversationId: string,
  token?: string,
): Promise<QaReviewBundle> {
  return agentChatSocketAckOrRest(
    (socket) => socket.sendFetchQaReviewBundleWithAck({ conversationId }),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/chat/qa/conversations/${encodeURIComponent(conversationId)}/review`,
        { headers: chatAuthHeaders(token) },
      );
      return unwrapChatHttpData<QaReviewBundle>(data);
    },
  );
}

export async function upsertQaSessionReview(
  conversationId: string,
  body: UpsertQaSessionReviewBody,
  _token?: string,
): Promise<unknown> {
  return agentChatSocketAckRequired<unknown>(
    (socket) =>
      socket.sendQaUpsertSessionReviewWithAck({
        conversationId,
        body: body as Record<string, unknown>,
      }),
    "save QA session review",
  );
}

export async function upsertQaMessageAnnotation(
  messageId: string,
  body: UpsertQaMessageAnnotationBody,
  _token?: string,
): Promise<unknown> {
  return agentChatSocketAckRequired<unknown>(
    (socket) =>
      socket.sendQaUpsertMessageAnnotationWithAck({
        messageId,
        body: body as Record<string, unknown>,
      }),
    "save QA message annotation",
  );
}

export async function assignQaReview(
  conversationId: string,
  body?: { qaUserId?: string },
  _token?: string,
): Promise<unknown> {
  return agentChatSocketAckRequired<unknown>(
    (socket) =>
      socket.sendQaAssignReviewWithAck({
        conversationId,
        qaUserId: body?.qaUserId,
      }),
    "assign QA review",
  );
}
