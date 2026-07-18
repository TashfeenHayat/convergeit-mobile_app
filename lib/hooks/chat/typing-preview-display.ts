import type { ConversationTypingEntry, TypingParticipantKind } from "./conversation-typing-bus";

export type TypingPreviewBubble = {
  id: string;
  role: "visitor" | "agent";
  label: string;
  draft: string;
  kind: TypingParticipantKind;
};

export function typingPreviewLabel(
  kind: TypingParticipantKind,
  visitorDisplayName: string,
  agentDisplayName: string,
): string {
  if (kind === "visitor") return visitorDisplayName;
  if (kind === "supervisor") return "Supervisor";
  return agentDisplayName;
}

export function typingEntriesToPreviews(
  entries: ConversationTypingEntry[],
  options: {
    visitorDisplayName: string;
    agentDisplayName: string;
  },
): TypingPreviewBubble[] {
  return entries.map((entry, idx) => {
    const label = typingPreviewLabel(
      entry.kind,
      options.visitorDisplayName,
      options.agentDisplayName,
    );
    return {
      id: `typing-${entry.kind}-${entry.userId ?? idx}`,
      role: entry.kind === "visitor" ? "visitor" : "agent",
      label,
      draft: entry.draft.trim(),
      kind: entry.kind,
    };
  });
}

export function hasAnyTypingDraft(entries: ConversationTypingEntry[]): boolean {
  return entries.some((entry) => entry.draft.trim().length > 0);
}
