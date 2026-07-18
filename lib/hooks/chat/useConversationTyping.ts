import { useEffect, useState } from "react";
import {
  getSidebarTypingPreview,
  subscribeConversationTyping,
  type ConversationTypingEntry,
  type TypingParticipantKind,
} from "./conversation-typing-bus";

export type SidebarTypingPreview = {
  conversationId: string;
  label: string;
  draft: string;
  kind: TypingParticipantKind;
};

export function useConversationTypingMap(): Map<string, ConversationTypingEntry> {
  const [map, setMap] = useState<Map<string, ConversationTypingEntry>>(new Map());
  useEffect(() => subscribeConversationTyping(setMap), []);
  return map;
}

export function useSidebarTypingPreviews(): Map<string, SidebarTypingPreview> {
  const typingMap = useConversationTypingMap();
  const previews = new Map<string, SidebarTypingPreview>();
  const cids = new Set<string>();
  for (const row of typingMap.values()) {
    if (row.draft.trim()) cids.add(row.conversationId);
  }
  for (const cid of cids) {
    const preview = getSidebarTypingPreview(cid);
    if (preview) previews.set(cid, { conversationId: cid, ...preview });
  }
  return previews;
}

export function useConversationTypingEntries(
  conversationId: string | null,
  options?: { excludeUserId?: string | null },
): ConversationTypingEntry[] {
  const typingMap = useConversationTypingMap();
  if (!conversationId) return [];

  const cid = conversationId.trim().toLowerCase();
  const exclude = options?.excludeUserId?.trim().toLowerCase() ?? "";
  const rows: ConversationTypingEntry[] = [];

  for (const row of typingMap.values()) {
    if (row.conversationId !== cid || !row.draft.trim()) continue;
    if (exclude && row.userId?.trim().toLowerCase() === exclude) continue;
    rows.push(row);
  }

  return rows.sort((a, b) => {
    const order: Record<TypingParticipantKind, number> = {
      visitor: 0,
      supervisor: 1,
      agent: 2,
    };
    const byKind = order[a.kind] - order[b.kind];
    return byKind !== 0 ? byKind : b.updatedAt - a.updatedAt;
  });
}
