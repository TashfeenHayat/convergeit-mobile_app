import { getAccessToken } from "@/api";
import { unwrapSocketAckPayload } from "@/lib/hooks/chat/chat-socket-delivery";
import { connectSharedAgentChat, getSharedAgentChatSocket } from "./sharedAgentChatSocket";
import type { ChatSocketClient } from "./chatSocket";
import { unwrapChatHttpData } from "./http";

export async function ensureAgentChatSocketReady(): Promise<ChatSocketClient | null> {
  const token = getAccessToken()?.trim();
  if (!token) return null;
  connectSharedAgentChat(token);
  const socket = getSharedAgentChatSocket();
  try {
    const ready = await socket.waitUntilSocketReady(12_000);
    return ready && socket.isConnected() ? socket : null;
  } catch {
    return null;
  }
}

export async function agentChatSocketAckOrRest<T>(
  socketCall: (socket: ChatSocketClient) => Promise<unknown>,
  restCall: () => Promise<T>,
): Promise<T> {
  const socket = await ensureAgentChatSocketReady();
  if (socket) {
    try {
      const ack = await socketCall(socket);
      const body = unwrapSocketAckPayload(ack);
      if (body !== undefined && body !== null && typeof body === "object") {
        return unwrapChatHttpData<T>(body);
      }
    } catch {
      /* REST fallback below */
    }
  }
  return restCall();
}

/** Agent inbox live path — no REST fallback when the dashboard chat socket is up. */
export async function agentChatSocketAckRequired<T>(
  socketCall: (socket: ChatSocketClient) => Promise<unknown>,
  operationLabel: string,
): Promise<T> {
  const socket = await ensureAgentChatSocketReady();
  if (!socket) {
    throw new Error(
      `Chat socket is not connected (${operationLabel}). Wait for Live chat to connect and try again.`,
    );
  }
  const ack = await socketCall(socket);
  const body = unwrapSocketAckPayload(ack);
  return unwrapChatHttpData<T>(body);
}
