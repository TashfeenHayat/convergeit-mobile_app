export type TypingParticipantKind = "visitor" | "agent" | "supervisor";

export type ConversationTypingEntry = {
  conversationId: string;
  kind: TypingParticipantKind;
  userId?: string;
  draft: string;
  updatedAt: number;
};

/** @deprecated Use ConversationTypingEntry */
export type VisitorTypingState = {
  conversationId: string;
  draft: string;
  updatedAt: number;
};

type Listener = (state: Map<string, ConversationTypingEntry>) => void;

const typingByKey = new Map<string, ConversationTypingEntry>();
const listeners = new Set<Listener>();
const clearTimers = new Map<string, ReturnType<typeof setTimeout>>();

const TYPING_STALE_MS = 8000;

function normalizeCid(conversationId: string): string {
  return conversationId.trim().toLowerCase();
}

function entryKey(
  conversationId: string,
  kind: TypingParticipantKind,
  userId?: string,
): string {
  return `${normalizeCid(conversationId)}:${kind}:${(userId ?? "").trim().toLowerCase()}`;
}

function emit() {
  listeners.forEach((fn) => {
    try {
      fn(new Map(typingByKey));
    } catch {
      /* ignore */
    }
  });
}

function scheduleStaleClear(key: string) {
  const prev = clearTimers.get(key);
  if (prev) clearTimeout(prev);
  clearTimers.set(
    key,
    setTimeout(() => {
      clearTimers.delete(key);
      const row = typingByKey.get(key);
      if (!row) return;
      if (Date.now() - row.updatedAt >= TYPING_STALE_MS - 250) {
        typingByKey.delete(key);
        emit();
      }
    }, TYPING_STALE_MS),
  );
}

export function setParticipantTyping(
  conversationId: string,
  kind: TypingParticipantKind,
  draft: string | null | undefined,
  userId?: string,
): void {
  const cid = normalizeCid(conversationId);
  if (!cid) return;
  const text = typeof draft === "string" ? draft : "";
  const key = entryKey(cid, kind, userId);
  if (!text.trim()) {
    clearParticipantTyping(cid, kind, userId);
    return;
  }
  typingByKey.set(key, {
    conversationId: cid,
    kind,
    userId: userId?.trim() || undefined,
    draft: text,
    updatedAt: Date.now(),
  });
  scheduleStaleClear(key);
  emit();
}

export function clearParticipantTyping(
  conversationId: string,
  kind?: TypingParticipantKind,
  userId?: string,
): void {
  const cid = normalizeCid(conversationId);
  if (!cid) return;

  if (kind) {
    const key = entryKey(cid, kind, userId);
    const timer = clearTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      clearTimers.delete(key);
    }
    if (!typingByKey.has(key)) return;
    typingByKey.delete(key);
    emit();
    return;
  }

  const prefix = `${cid}:`;
  let changed = false;
  for (const key of [...typingByKey.keys()]) {
    if (!key.startsWith(prefix)) continue;
    const timer = clearTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      clearTimers.delete(key);
    }
    typingByKey.delete(key);
    changed = true;
  }
  if (changed) emit();
}

export function getTypingEntriesForConversation(
  conversationId: string,
  options?: { excludeUserId?: string | null },
): ConversationTypingEntry[] {
  const cid = normalizeCid(conversationId);
  if (!cid) return [];
  const exclude = options?.excludeUserId?.trim().toLowerCase() ?? "";
  const rows: ConversationTypingEntry[] = [];
  for (const row of typingByKey.values()) {
    if (row.conversationId !== cid || !row.draft.trim()) continue;
    if (exclude && row.userId?.trim().toLowerCase() === exclude) continue;
    rows.push(row);
  }
  return rows.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getVisitorTypingDraft(conversationId: string): string {
  const visitor = getTypingEntriesForConversation(conversationId).find(
    (e) => e.kind === "visitor",
  );
  return visitor?.draft?.trim() ?? "";
}

export function getSidebarTypingPreview(conversationId: string): {
  label: string;
  draft: string;
  kind: TypingParticipantKind;
} | null {
  const entries = getTypingEntriesForConversation(conversationId);
  const priority: TypingParticipantKind[] = ["visitor", "supervisor", "agent"];
  for (const kind of priority) {
    const row = entries.find((e) => e.kind === kind);
    if (!row?.draft.trim()) continue;
    const label =
      kind === "visitor" ? "" : kind === "supervisor" ? "Supervisor" : "Agent";
    return { label, draft: row.draft.trim(), kind };
  }
  return null;
}

export function setVisitorTypingDraft(
  conversationId: string,
  draft: string | null | undefined,
): void {
  setParticipantTyping(conversationId, "visitor", draft);
}

export function clearVisitorTyping(conversationId: string): void {
  clearParticipantTyping(conversationId, "visitor");
}

export function subscribeConversationTyping(listener: Listener): () => void {
  listeners.add(listener);
  listener(new Map(typingByKey));
  return () => listeners.delete(listener);
}

/** @deprecated Use subscribeConversationTyping */
export function subscribeVisitorTyping(listener: (state: Map<string, VisitorTypingState>) => void): () => void {
  return subscribeConversationTyping((map) => {
    const visitorMap = new Map<string, VisitorTypingState>();
    for (const row of map.values()) {
      if (row.kind !== "visitor" || !row.draft.trim()) continue;
      visitorMap.set(row.conversationId, {
        conversationId: row.conversationId,
        draft: row.draft,
        updatedAt: row.updatedAt,
      });
    }
    listener(visitorMap);
  });
}
