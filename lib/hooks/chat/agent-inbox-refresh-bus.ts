type InboxRefreshListener = () => void;

const listeners = new Set<InboxRefreshListener>();

let lastFullRefreshAt = 0;
const MIN_FULL_REFRESH_MS = 4000;

export function subscribeAgentInboxRefresh(listener: InboxRefreshListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishAgentInboxRefresh(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore listener errors */
    }
  });
}

/** Full inbox refetch (3 APIs) — rate-limited unless forced. Prefer inbox deltas for live events. */
export function publishAgentInboxRefreshFull(force = false): void {
  if (typeof window === "undefined") {
    publishAgentInboxRefresh();
    return;
  }
  const now = Date.now();
  if (!force && now - lastFullRefreshAt < MIN_FULL_REFRESH_MS) {
    return;
  }
  lastFullRefreshAt = now;
  publishAgentInboxRefresh();
}

/**
 * After Talk to agent / transfer when DB assignment may lag behind socket deltas.
 */
export function publishAgentInboxRefreshAfterTalkToAgent(
  followUpDelaysMs?: number[],
  options?: { forceInitial?: boolean },
): void {
  publishAgentInboxRefreshSoon(followUpDelaysMs, options);
}

/**
 * @deprecated Prefer {@link publishAgentInboxRefreshAfterTalkToAgent} for HYBRID handoff.
 */
export function publishAgentInboxRefreshSoon(
  followUpDelaysMs: number[] = [1500],
  options?: { forceInitial?: boolean },
): void {
  publishAgentInboxRefreshFull(options?.forceInitial === true);
  if (typeof window === "undefined") return;
  for (const delay of followUpDelaysMs) {
    window.setTimeout(() => {
      publishAgentInboxRefreshFull(true);
    }, delay);
  }
}
