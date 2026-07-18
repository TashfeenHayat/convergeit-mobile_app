import { apiClient } from "@/api";
import { unwrapSocketAckPayload } from "@/lib/hooks/chat/chat-socket-delivery";
import { getSharedAgentChatSocket } from "./sharedAgentChatSocket";
import type { ChatSocketClient } from "./chatSocket";
import { unwrapChatHttpData } from "./http";
import type {
  ChatTakeoverRequest,
  ChatWhisper,
  CreateWhisperBody,
  RequestTakeoverBody,
  RequestTakeoverResult,
} from "./supervisor.types";

function conversationPath(conversationId: string): string {
  return `/chat/conversations/${encodeURIComponent(conversationId)}`;
}

async function ensureAgentSocketReady(): Promise<ChatSocketClient | null> {
  const socket = getSharedAgentChatSocket();
  try {
    const ready = await socket.waitUntilSocketReady(12_000);
    return ready && socket.isConnected() ? socket : null;
  } catch {
    return null;
  }
}

async function agentSocketAckOrRest<T>(
  socketCall: (socket: ChatSocketClient) => Promise<unknown>,
  restCall: () => Promise<T>,
): Promise<T> {
  const socket = await ensureAgentSocketReady();
  if (socket) {
    try {
      const ack = await socketCall(socket);
      const body = unwrapSocketAckPayload(ack);
      if (body && typeof body === "object") {
        return unwrapChatHttpData<T>(body);
      }
    } catch {
      /* REST fallback below */
    }
  }
  return restCall();
}

export async function fetchConversationWhispers(
  conversationId: string,
): Promise<ChatWhisper[]> {
  const { data } = await apiClient.get<unknown>(
    `${conversationPath(conversationId)}/whispers`,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  return Array.isArray(raw) ? (raw as ChatWhisper[]) : [];
}

export async function createConversationWhisper(
  conversationId: string,
  body: CreateWhisperBody,
): Promise<{ whisper: ChatWhisper; agentMustClickSend: boolean }> {
  return agentSocketAckOrRest(
    (socket) =>
      socket.sendSupervisorWhisperWithAck(
        { conversationId, message: body.message },
        15_000,
      ),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `${conversationPath(conversationId)}/whispers`,
        body,
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function fetchTakeoverRequests(
  conversationId: string,
): Promise<ChatTakeoverRequest[]> {
  const { data } = await apiClient.get<unknown>(
    `${conversationPath(conversationId)}/takeover/requests`,
  );
  const raw = unwrapChatHttpData<unknown>(data);
  return Array.isArray(raw) ? (raw as ChatTakeoverRequest[]) : [];
}

export async function requestConversationTakeover(
  conversationId: string,
  body: RequestTakeoverBody,
): Promise<RequestTakeoverResult> {
  return agentSocketAckOrRest(
    (socket) =>
      socket.sendSupervisorTakeoverRequestWithAck(
        {
          conversationId,
          targetAgentId: body.targetAgentId,
          note: body.note,
        },
        15_000,
      ),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `${conversationPath(conversationId)}/takeover/request`,
        body,
      );
      return unwrapChatHttpData<RequestTakeoverResult>(data);
    },
  );
}

export async function approveTakeoverRequest(
  conversationId: string,
  requestId: string,
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `${conversationPath(conversationId)}/takeover/requests/${encodeURIComponent(requestId)}/approve`,
  );
  return unwrapChatHttpData(data);
}

export async function rejectTakeoverRequest(
  conversationId: string,
  requestId: string,
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `${conversationPath(conversationId)}/takeover/requests/${encodeURIComponent(requestId)}/reject`,
  );
  return unwrapChatHttpData(data);
}

export async function startDirectSupervisorControl(
  conversationId: string,
): Promise<{ mode: string; supervisorControlUserId: string; agentReadOnly: boolean }> {
  return agentSocketAckOrRest(
    (socket) =>
      socket.sendSupervisorControlStartWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `${conversationPath(conversationId)}/supervisor/control/start`,
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function releaseDirectSupervisorControl(
  conversationId: string,
): Promise<{ released: boolean }> {
  return agentSocketAckOrRest(
    (socket) =>
      socket.sendSupervisorControlReleaseWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `${conversationPath(conversationId)}/supervisor/control/release`,
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function sendSupervisorControlMessage(
  conversationId: string,
  message: string,
): Promise<unknown> {
  return agentSocketAckOrRest(
    (socket) =>
      socket.sendSupervisorMessageWithAck({ conversationId, message }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `${conversationPath(conversationId)}/supervisor/messages`,
        { message },
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function supervisorCloseConversation(
  conversationId: string,
  body: { reason?: string } = {},
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `${conversationPath(conversationId)}/supervisor/close`,
    body,
  );
  return unwrapChatHttpData(data);
}
