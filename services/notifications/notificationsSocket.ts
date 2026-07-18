import { env } from "@/constants/env";
import { consumeAgentRealtimeTokenChange, resetAgentRealtimeToken } from "@/services/socket/sharedAgentRealtime";
import {
  resolveSocketEndpoint,
  SocketConnection,
} from "@/services/socket";
import type { NotificationSocketEvent } from "./notifications.types";

const notificationsSocketEndpoint = resolveSocketEndpoint({
  envBaseUrl: env.notificationsSocketBaseUrl || undefined,
  envFallbackBaseUrl: env.apiBaseUrl,
  envNamespace: env.notificationsSocketNamespace,
  defaultNamespace: "/notifications",
});

export class NotificationsSocketClient {
  private connection = new SocketConnection(notificationsSocketEndpoint);

  connect(authToken: string, forceNew = false): void {
    this.connection.connect({ authToken, forceNew });
  }

  disconnect(hard = false): void {
    this.connection.disconnect(true, hard);
  }

  isConnected(): boolean {
    return this.connection.isConnected();
  }

  async waitUntilConnected(timeoutMs = 12_000): Promise<boolean> {
    try {
      await this.connection.waitUntilConnected(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  /** Transport up and server accepted JWT (`connected` event). */
  async waitUntilSocketReady(timeoutMs = 12_000): Promise<boolean> {
    try {
      await this.connection.waitUntilSocketReady(timeoutMs);
      return true;
    } catch {
      return false;
    }
  }

  onNotification(listener: (payload: NotificationSocketEvent) => void): () => void {
    return this.connection.on<NotificationSocketEvent>("notification", listener);
  }

  onSocketConnect(listener: () => void): () => void {
    return this.connection.on("connect", listener);
  }

  onSocketDisconnect(listener: () => void): () => void {
    return this.connection.on("disconnect", listener);
  }

  fetchSnapshotWithAck(
    payload: { unreadOnly?: boolean },
    timeoutMs?: number,
  ): Promise<unknown> {
    return this.connection.emitWithAck("fetch_snapshot", payload, timeoutMs);
  }
}

let sharedNotificationsSocket: NotificationsSocketClient | null = null;

export function getSharedNotificationsSocket(): NotificationsSocketClient {
  if (!sharedNotificationsSocket) {
    sharedNotificationsSocket = new NotificationsSocketClient();
  }
  return sharedNotificationsSocket;
}

/** Multiplexes on the same transport as agent `/chat` when the token matches. */
export function connectSharedNotifications(authToken: string): void {
  const token = authToken.trim();
  if (!token) return;
  getSharedNotificationsSocket().connect(
    token,
    consumeAgentRealtimeTokenChange(token),
  );
}

export function disconnectSharedNotifications(hard = false): void {
  resetAgentRealtimeToken();
  if (sharedNotificationsSocket) {
    sharedNotificationsSocket.disconnect(hard);
  }
}
