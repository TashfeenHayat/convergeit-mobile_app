import type {
  AgentVisitorPresentation,
  ConversationSummary,
} from "./chat.types";

export type { AgentVisitorPresentation };

export function extractVisitorPresentation(
  source:
    | ConversationSummary
    | { visitorPresentation?: AgentVisitorPresentation }
    | Record<string, unknown>
    | null
    | undefined,
): AgentVisitorPresentation | null {
  if (!source || typeof source !== "object") return null;
  const vp = (source as Record<string, unknown>).visitorPresentation;
  if (!vp || typeof vp !== "object") return null;
  return vp as AgentVisitorPresentation;
}

export interface InboxRowLabels {
  title: string;
  subtitle: string | null;
  initials: string;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "V";
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Primary inbox / popup labels — always prefer API `visitorPresentation`.
 */
export function getInboxRowLabels(
  conversation: ConversationSummary | { id: string; visitorPresentation?: AgentVisitorPresentation },
  fallbackDisplayName?: string,
): InboxRowLabels {
  const vp = extractVisitorPresentation(conversation);
  if (vp) {
    const title = (vp.inboxTitle || vp.displayName || "Visitor").trim();
    const subtitle =
      [vp.originLabel, vp.locationLabel].filter(Boolean).join(" · ") ||
      (vp.subtitle?.trim() ? vp.subtitle.trim() : null);
    return {
      title,
      subtitle,
      initials: initialsFromName(vp.displayName || title),
    };
  }

  const raw =
    conversation && typeof conversation === "object"
      ? (conversation as Record<string, unknown>)
      : null;
  const flatDisplay =
    typeof raw?.displayName === "string" ? raw.displayName.trim() : "";
  const flatInbox =
    typeof raw?.inboxTitle === "string" ? raw.inboxTitle.trim() : "";
  if (flatDisplay || flatInbox) {
    const title = flatInbox || flatDisplay;
    const origin =
      typeof raw?.originLabel === "string" ? raw.originLabel.trim() : "";
    return {
      title,
      subtitle: origin || null,
      initials: initialsFromName(flatDisplay || title),
    };
  }

  const fallback =
    fallbackDisplayName?.trim() ||
    `Visitor ${String(conversation.id).slice(0, 6)}`;

  return {
    title: fallback,
    subtitle: null,
    initials: initialsFromName(fallback),
  };
}
