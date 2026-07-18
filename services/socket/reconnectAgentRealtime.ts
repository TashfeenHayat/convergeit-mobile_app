import {
  connectSharedAgentChat,
  disconnectSharedAgentChat,
  getSharedAgentChatSocket,
} from "@/services/chat/sharedAgentChatSocket";
import {
  connectSharedNotifications,
  disconnectSharedNotifications,
  getSharedNotificationsSocket,
} from "@/services/notifications/notificationsSocket";

/**
 * Hard-reconnect agent `/chat` + `/notifications` after access-token swap
 * (login-as, revert impersonation, refresh rotation).
 */
export async function reconnectAgentRealtime(authToken: string): Promise<boolean> {
  const token = authToken.trim();
  if (!token) {
    disconnectSharedAgentChat(true);
    disconnectSharedNotifications(true);
    return false;
  }

  disconnectSharedAgentChat(true);
  disconnectSharedNotifications(true);

  connectSharedAgentChat(token);
  connectSharedNotifications(token);

  const [chatReady, notifReady] = await Promise.all([
    getSharedAgentChatSocket().waitUntilSocketReady(12_000),
    getSharedNotificationsSocket().waitUntilSocketReady(12_000),
  ]);

  return Boolean(chatReady && notifReady);
}
