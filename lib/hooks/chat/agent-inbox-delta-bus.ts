import type { InboxQueuePatch } from "./agent-inbox-queue-patch";

type InboxDeltaListener = (patch: InboxQueuePatch) => void;

const deltaListeners = new Set<InboxDeltaListener>();

export function subscribeAgentInboxDelta(listener: InboxDeltaListener): () => void {
  deltaListeners.add(listener);
  return () => deltaListeners.delete(listener);
}

export function publishAgentInboxDelta(patch: InboxQueuePatch): void {
  deltaListeners.forEach((fn) => {
    try {
      fn(patch);
    } catch {
      /* ignore listener errors */
    }
  });
}
