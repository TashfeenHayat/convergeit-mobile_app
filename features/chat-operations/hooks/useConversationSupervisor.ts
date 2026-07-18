import { useCallback } from "react";
import { createConversationWhisper } from "@/services/chat/supervisor.api";

export function useConversationSupervisor(conversationId: string | null, enabled: boolean) {
  const sendWhisper = useCallback(
    async (message: string) => {
      if (!conversationId || !enabled) return;
      await createConversationWhisper(conversationId, { message });
    },
    [conversationId, enabled],
  );

  return {
    sendWhisper,
  };
}
