import { useEffect } from "react";
import {
  connectSharedAgentChat,
  getSharedAgentChatSocket,
} from "@/services/chat/sharedAgentChatSocket";

export function useChatQaSocket(
  token: string,
  enabled: boolean,
  onQueueUpdated: () => void,
  onReviewUpdated: (conversationId: string) => void,
): void {
  useEffect(() => {
    if (!enabled || !token) return undefined;

    const socketClient = getSharedAgentChatSocket();
    connectSharedAgentChat(token);

    const offQueue = socketClient.onQaQueueUpdated(() => {
      onQueueUpdated();
    });
    const offReview = socketClient.onQaReviewUpdated((payload) => {
      const cid =
        payload && typeof payload === "object"
          ? String((payload as { conversationId?: string }).conversationId ?? "")
          : "";
      if (cid) onReviewUpdated(cid);
      else onQueueUpdated();
    });

    return () => {
      offQueue();
      offReview();
    };
  }, [enabled, onQueueUpdated, onReviewUpdated, token]);
}
