type MessageSyncListener = (conversationId: string) => void;

const listeners = new Set<MessageSyncListener>();

/** Request a one-shot transcript merge for an open conversation (e.g. from /notifications). */
export function subscribeAgentChatMessageSync(listener: MessageSyncListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAgentChatMessageSync(conversationId: string): void {
  const cid = conversationId.trim();
  if (!cid) return;
  listeners.forEach((fn) => {
    try {
      fn(cid);
    } catch {
      /* ignore listener errors */
    }
  });
}
