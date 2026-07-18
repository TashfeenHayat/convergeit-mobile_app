import { apiClient } from "@/api/http/axios-instance";
import { unwrapSocketAckPayload } from "@/lib/hooks/chat/chat-socket-delivery";
import { normalizeConversationHistoryPayload } from "./conversation-normalizers";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import type {
  GuestSessionExchangeResponse,
  GuestTranscriptResponse,
} from "./guest.types";

export type GuestSocketClient = {
  isConnected(): boolean;
  waitUntilSocketReady(timeoutMs?: number): Promise<boolean>;
  connect(options?: { authToken?: string; forceNew?: boolean }): unknown;
  fetchTranscriptWithAck(
    payload: { conversationId: string; websiteId: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  sendSupervisorWhisperWithAck(
    payload: { conversationId: string; message: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  sendSupervisorControlStartWithAck(
    payload: { conversationId: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  sendSupervisorControlReleaseWithAck(
    payload: { conversationId: string },
    timeoutMs?: number,
  ): Promise<unknown>;
  sendSupervisorMessageWithAck(
    payload: { conversationId: string; message: string },
    timeoutMs?: number,
  ): Promise<unknown>;
};

function parseGuestTranscriptPayload(
  raw: unknown,
  conversationId: string,
): GuestTranscriptResponse {
  const unwrapped = unwrapSocketAckPayload(raw);
  const normalized = normalizeConversationHistoryPayload(unwrapped, conversationId);
  return {
    ...(typeof unwrapped === "object" && unwrapped !== null
      ? (unwrapped as Record<string, unknown>)
      : {}),
    ...normalized,
    readOnly: true,
  };
}

async function ensureGuestSocketReady(
  socketClient: GuestSocketClient | undefined,
  guestAccessToken: string,
): Promise<boolean> {
  if (!socketClient || !guestAccessToken.trim()) return false;
  socketClient.connect({ authToken: guestAccessToken });
  return socketClient.waitUntilSocketReady(12_000);
}

export async function exchangeGuestLinkToken(
  token: string,
  supervisorEmail?: string | null,
): Promise<GuestSessionExchangeResponse> {
  const { data } = await apiClient.post<unknown>("/chat/guest/session", {
    token,
    ...(supervisorEmail?.trim()
      ? { supervisorEmail: supervisorEmail.trim().toLowerCase() }
      : {}),
  });
  return unwrapChatHttpData<GuestSessionExchangeResponse>(data);
}

async function getGuestTranscriptRest(
  conversationId: string,
  guestAccessToken: string,
): Promise<GuestTranscriptResponse> {
  const { data } = await apiClient.get<unknown>(
    `/chat/guest/conversations/${encodeURIComponent(conversationId)}/transcript`,
    { headers: chatAuthHeaders(guestAccessToken) },
  );
  return parseGuestTranscriptPayload(data, conversationId);
}

export async function getGuestTranscript(
  conversationId: string,
  guestAccessToken: string,
  websiteId: string,
  socketClient?: GuestSocketClient,
): Promise<GuestTranscriptResponse> {
  const ready = await ensureGuestSocketReady(socketClient, guestAccessToken);
  if (ready && socketClient?.isConnected()) {
    try {
      const ack = await socketClient.fetchTranscriptWithAck(
        { conversationId, websiteId },
        15_000,
      );
      return parseGuestTranscriptPayload(ack, conversationId);
    } catch {
      /* REST fallback below */
    }
  }
  return getGuestTranscriptRest(conversationId, guestAccessToken);
}

async function guestSocketAckOrRest<T>(
  socketClient: GuestSocketClient | undefined,
  guestAccessToken: string,
  socketCall: (client: GuestSocketClient) => Promise<unknown>,
  restCall: () => Promise<T>,
): Promise<T> {
  const ready = await ensureGuestSocketReady(socketClient, guestAccessToken);
  if (ready && socketClient?.isConnected()) {
    try {
      const ack = await socketCall(socketClient);
      return (unwrapSocketAckPayload(ack) ?? ack) as T;
    } catch {
      /* REST fallback below */
    }
  }
  return restCall();
}

export async function createGuestWhisper(
  conversationId: string,
  guestAccessToken: string,
  message: string,
  socketClient?: GuestSocketClient,
): Promise<unknown> {
  return guestSocketAckOrRest(
    socketClient,
    guestAccessToken,
    (client) =>
      client.sendSupervisorWhisperWithAck({ conversationId, message }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/guest/conversations/${encodeURIComponent(conversationId)}/whispers`,
        { message },
        { headers: chatAuthHeaders(guestAccessToken) },
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function requestGuestTakeover(
  conversationId: string,
  guestAccessToken: string,
  body?: { targetAgentId?: string; note?: string },
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `/chat/guest/conversations/${encodeURIComponent(conversationId)}/takeover/request`,
    body ?? {},
    { headers: chatAuthHeaders(guestAccessToken) },
  );
  return unwrapChatHttpData(data);
}

export async function startGuestDirectControl(
  conversationId: string,
  guestAccessToken: string,
  socketClient?: GuestSocketClient,
): Promise<{
  mode: string;
  supervisorControlUserId: string;
  agentId: string | null;
  agentReadOnly: boolean;
  involvementUserId?: string;
}> {
  return guestSocketAckOrRest(
    socketClient,
    guestAccessToken,
    (client) => client.sendSupervisorControlStartWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/guest/conversations/${encodeURIComponent(conversationId)}/supervisor/control/start`,
        {},
        { headers: chatAuthHeaders(guestAccessToken) },
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function releaseGuestDirectControl(
  conversationId: string,
  guestAccessToken: string,
  socketClient?: GuestSocketClient,
): Promise<{ released: boolean; agentId: string | null }> {
  return guestSocketAckOrRest(
    socketClient,
    guestAccessToken,
    (client) => client.sendSupervisorControlReleaseWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/guest/conversations/${encodeURIComponent(conversationId)}/supervisor/control/release`,
        {},
        { headers: chatAuthHeaders(guestAccessToken) },
      );
      return unwrapChatHttpData(data);
    },
  );
}

export async function sendGuestDirectControlMessage(
  conversationId: string,
  guestAccessToken: string,
  message: string,
  socketClient?: GuestSocketClient,
): Promise<unknown> {
  return guestSocketAckOrRest(
    socketClient,
    guestAccessToken,
    (client) =>
      client.sendSupervisorMessageWithAck({ conversationId, message }, 15_000),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/guest/conversations/${encodeURIComponent(conversationId)}/supervisor/messages`,
        { message },
        { headers: chatAuthHeaders(guestAccessToken) },
      );
      return unwrapChatHttpData(data);
    },
  );
}
