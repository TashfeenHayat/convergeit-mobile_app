export type AgentChatNotificationSyncReason =
  | "assignment"
  | "queue"
  | "visitor_message";

type SyncListener = (
  reason: AgentChatNotificationSyncReason,
  conversationId?: string,
) => void;

const listeners = new Set<SyncListener>();

/** Chat `/chat` socket delivered an event that should have a matching bell badge. */
export function subscribeAgentChatNotificationSync(
  listener: SyncListener,
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAgentChatNotificationSync(
  reason: AgentChatNotificationSyncReason,
  conversationId?: string,
): void {
  const cid = conversationId?.trim() || undefined;
  listeners.forEach((fn) => {
    try {
      fn(reason, cid);
    } catch {
      /* ignore listener errors */
    }
  });
}
