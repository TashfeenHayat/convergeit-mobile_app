import { normalizeConversationSummary } from "@/services/chat/conversation-normalizers";
import type {
  AgentVisitorPresentation,
  ConversationSummary,
} from "@/services/chat/chat.types";
import { conversationIdFromSocketPayload } from "./agent-chat.utils";

function cidOf(row: ConversationSummary): string {
  return (row.id || row.conversationId || "").toLowerCase();
}

function removeId(list: ConversationSummary[], conversationId: string): ConversationSummary[] {
  const needle = conversationId.toLowerCase();
  return list.filter((c) => cidOf(c) !== needle);
}

function presentationFromFlatFields(
  source: Record<string, unknown>,
): AgentVisitorPresentation | null {
  if (
    source.visitorPresentation &&
    typeof source.visitorPresentation === "object"
  ) {
    return source.visitorPresentation as AgentVisitorPresentation;
  }
  const displayName =
    typeof source.displayName === "string" ? source.displayName.trim() : "";
  const inboxTitle =
    typeof source.inboxTitle === "string" ? source.inboxTitle.trim() : "";
  if (!displayName && !inboxTitle) return null;
  return {
    visitorProfileComplete: Boolean(source.visitorProfileComplete),
    displayName: displayName || inboxTitle || "Visitor",
    subtitle:
      typeof source.subtitle === "string" ? source.subtitle : null,
    originLabel: String(source.originLabel ?? ""),
    locationLabel:
      typeof source.locationLabel === "string" ? source.locationLabel : null,
    inboxTitle: inboxTitle || displayName || "Visitor",
    websiteName: String(source.websiteName ?? ""),
    childCompanyName: String(source.childCompanyName ?? ""),
    websiteUrl: String(source.websiteUrl ?? ""),
  };
}

export function mergeConversationSummaries(
  existing: ConversationSummary | undefined,
  incoming: ConversationSummary,
): ConversationSummary {
  if (!existing) return incoming;
  const merged = normalizeConversationSummary({
    ...existing,
    ...incoming,
    id: incoming.id || existing.id,
    conversationId: incoming.conversationId ?? existing.conversationId,
  });
  const existingVp = presentationFromFlatFields(
    existing as Record<string, unknown>,
  );
  const incomingVp = presentationFromFlatFields(
    incoming as Record<string, unknown>,
  );
  if (incomingVp) {
    merged.visitorPresentation = incomingVp;
  } else if (existingVp) {
    merged.visitorPresentation = existingVp;
  }
  for (const key of [
    "lastMessage",
    "last_message",
    "preview",
    "lastMessagePreview",
    "messages",
  ] as const) {
    const inc = (incoming as Record<string, unknown>)[key];
    const prev = (existing as Record<string, unknown>)[key];
    if ((inc == null || inc === "") && prev != null && prev !== "") {
      (merged as Record<string, unknown>)[key] = prev;
    }
  }
  if (!merged.lastMessageAt && existing.lastMessageAt) {
    merged.lastMessageAt = existing.lastMessageAt;
  }
  return merged;
}

function upsertRow(
  list: ConversationSummary[],
  row: ConversationSummary,
): ConversationSummary[] {
  const needle = cidOf(row);
  if (!needle) return list;
  const existing = list.find((c) => cidOf(c) === needle);
  const merged = mergeConversationSummaries(existing, row);
  return [merged, ...list.filter((c) => cidOf(c) !== needle)];
}

function patchRowFields(
  list: ConversationSummary[],
  conversationId: string,
  fields: Partial<ConversationSummary>,
): ConversationSummary[] {
  const needle = conversationId.toLowerCase();
  let changed = false;
  const next = list.map((row) => {
    if (cidOf(row) !== needle) return row;
    changed = true;
    return mergeConversationSummaries(row, {
      ...row,
      ...fields,
      id: row.id,
      conversationId: row.conversationId ?? conversationId,
    });
  });
  return changed ? next : list;
}

export function summaryFromSocketPayload(payload: unknown): ConversationSummary | null {
  const conversationId = conversationIdFromSocketPayload(payload);
  if (!conversationId) return null;
  const o =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const visitorPresentation = presentationFromFlatFields(o);
  return normalizeConversationSummary({
    ...o,
    conversationId,
    id: conversationId,
    ...(visitorPresentation ? { visitorPresentation } : {}),
    status:
      typeof o.status === "string"
        ? o.status
        : typeof (o as { agentId?: string }).agentId === "string"
          ? "assigned"
          : "waiting",
    queuedForAgent: o.status === "waiting" || o.queuedForAgent === true,
  });
}

function presentationFromSocketPayload(
  payload: unknown,
): AgentVisitorPresentation | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const nested =
    o.visitorPresentation && typeof o.visitorPresentation === "object"
      ? (o.visitorPresentation as Record<string, unknown>)
      : o;
  const displayName =
    typeof nested.displayName === "string" ? nested.displayName.trim() : "";
  if (!displayName && typeof nested.inboxTitle !== "string") return null;
  return {
    visitorProfileComplete: Boolean(nested.visitorProfileComplete),
    displayName: displayName || String(nested.inboxTitle ?? "Visitor"),
    subtitle:
      typeof nested.subtitle === "string" ? nested.subtitle : null,
    originLabel: String(nested.originLabel ?? ""),
    locationLabel:
      typeof nested.locationLabel === "string" ? nested.locationLabel : null,
    inboxTitle: String(nested.inboxTitle ?? displayName ?? "Visitor"),
    websiteName: String(nested.websiteName ?? ""),
    childCompanyName: String(nested.childCompanyName ?? ""),
    websiteUrl: String(nested.websiteUrl ?? ""),
  };
}

function patchRowPresentation(
  row: ConversationSummary,
  presentation: AgentVisitorPresentation,
): ConversationSummary {
  return { ...row, visitorPresentation: presentation };
}

export type InboxQueuePatch =
  | {
      kind: "assigned_to_agent";
      conversationId: string;
      agentId: string;
      summary: ConversationSummary;
    }
  | { kind: "queue_add"; summary: ConversationSummary }
  | { kind: "conversation_closed"; conversationId: string }
  | { kind: "conversation_resumed"; summary: ConversationSummary }
  | {
      kind: "visitor_profile_updated";
      conversationId: string;
      visitorPresentation: AgentVisitorPresentation;
    }
  | {
      kind: "row_enrich";
      conversationId: string;
      fields: Partial<ConversationSummary>;
    }
  | { kind: "conversation_reassigned_away"; conversationId: string };

export function buildInboxPatchFromSocket(
  event: string,
  payload: unknown,
  currentAgentId: string | null | undefined,
): InboxQueuePatch | null {
  const summary = summaryFromSocketPayload(payload);
  const conversationId = conversationIdFromSocketPayload(payload);
  if (!conversationId) return null;

  const ev = event.toLowerCase();
  if (
    ev === "chat_handover" ||
    ev === "chat_transferred" ||
    ev === "chat_talk_to_agent"
  ) {
    const fromAgentId =
      payload && typeof payload === "object"
        ? String((payload as { fromAgentId?: string }).fromAgentId ?? "").trim()
        : "";
    const toAgentId =
      payload && typeof payload === "object"
        ? String(
            (payload as { toAgentId?: string }).toAgentId ??
              (payload as { agentId?: string }).agentId ??
              (payload as { assignedAgentId?: string }).assignedAgentId ??
              "",
          ).trim()
        : "";
    if (
      currentAgentId &&
      fromAgentId &&
      fromAgentId.toLowerCase() === currentAgentId.toLowerCase()
    ) {
      return { kind: "conversation_reassigned_away", conversationId };
    }
    if (!toAgentId) {
      if (ev === "chat_talk_to_agent") {
        if (!summary) return null;
        return {
          kind: "queue_add",
          summary: {
            ...summary,
            status: "waiting",
            queuedForAgent: true,
            talkToAgentRequested: true,
            handoverRequested: true,
          },
        };
      }
      return null;
    }
    const lastTransferFrom =
      payload && typeof payload === "object"
        ? (payload as { lastTransferFrom?: ConversationSummary["lastTransferFrom"] })
            .lastTransferFrom
        : undefined;
    const row =
      summary ??
      normalizeConversationSummary({
        conversationId,
        id: conversationId,
        agentId: toAgentId,
        assignedAgentId: toAgentId,
        status: "assigned",
      });
    if (currentAgentId && toAgentId !== currentAgentId) {
      return { kind: "queue_add", summary: { ...row, status: "waiting" } };
    }
    return {
      kind: "assigned_to_agent",
      conversationId,
      agentId: toAgentId,
      summary: {
        ...row,
        status: "assigned",
        assignedAgentId: toAgentId,
        agentId: toAgentId,
        queuedForAgent: false,
        ...(lastTransferFrom ? { lastTransferFrom } : {}),
      },
    };
  }

  if (ev === "agent_assignment_popup" || ev === "chat_assigned") {
    const agentId =
      payload && typeof payload === "object"
        ? String(
            (payload as { agentId?: string }).agentId ??
              (payload as { assignedAgentId?: string }).assignedAgentId ??
              "",
          ).trim()
        : "";
    if (!summary) return null;
    if (currentAgentId && agentId && agentId !== currentAgentId) {
      return { kind: "queue_add", summary: { ...summary, status: "waiting" } };
    }
    return {
      kind: "assigned_to_agent",
      conversationId,
      agentId: agentId || currentAgentId || "",
      summary: {
        ...summary,
        status: "assigned",
        assignedAgentId: agentId || currentAgentId || undefined,
        agentId: agentId || currentAgentId || undefined,
        queuedForAgent: false,
      },
    };
  }

  if (ev === "agent_queue_popup" || ev === "chat_queued") {
    if (!summary) return null;
    return {
      kind: "queue_add",
      summary: { ...summary, status: "waiting", queuedForAgent: true },
    };
  }

  if (ev === "chat_offline") {
    if (!summary) return null;
    return {
      kind: "queue_add",
      summary: { ...summary, status: "offline", queuedForAgent: false },
    };
  }

  if (
    ev === "chat_closed" ||
    ev === "chat_completed" ||
    ev === "agent_wrap_up_submitted" ||
    ev === "agent_distribution_submitted" ||
    ev === "chat_marked_spam"
  ) {
    return { kind: "conversation_closed", conversationId };
  }

  if (ev === "chat_resumed") {
    if (!summary) return null;
    return { kind: "conversation_resumed", summary };
  }

  if (ev === "visitor_profile_updated") {
    const presentation = presentationFromSocketPayload(payload);
    if (!presentation) return null;
    return { kind: "visitor_profile_updated", conversationId, visitorPresentation: presentation };
  }

  return null;
}

export function applyInboxQueuePatch(
  state: {
    activeChats: ConversationSummary[];
    waitingChats: ConversationSummary[];
    closedChats: ConversationSummary[];
  },
  patch: InboxQueuePatch,
  currentAgentId: string | null | undefined,
): {
  activeChats: ConversationSummary[];
  waitingChats: ConversationSummary[];
  closedChats: ConversationSummary[];
  needsClosedRefresh?: boolean;
} {
  let { activeChats, waitingChats, closedChats } = state;

  switch (patch.kind) {
    case "assigned_to_agent": {
      if (
        currentAgentId &&
        patch.agentId &&
        patch.agentId.toLowerCase() !== currentAgentId.toLowerCase()
      ) {
        waitingChats = removeId(waitingChats, patch.conversationId);
        return { activeChats, waitingChats, closedChats };
      }
      activeChats = upsertRow(activeChats, patch.summary);
      waitingChats = removeId(waitingChats, patch.conversationId);
      closedChats = removeId(closedChats, patch.conversationId);
      return { activeChats, waitingChats, closedChats };
    }
    case "queue_add": {
      activeChats = removeId(activeChats, cidOf(patch.summary));
      return { activeChats, waitingChats, closedChats };
    }
    case "conversation_closed": {
      activeChats = removeId(activeChats, patch.conversationId);
      waitingChats = removeId(waitingChats, patch.conversationId);
      return {
        activeChats,
        waitingChats,
        closedChats,
        needsClosedRefresh: true,
      };
    }
    case "conversation_reassigned_away": {
      activeChats = removeId(activeChats, patch.conversationId);
      waitingChats = removeId(waitingChats, patch.conversationId);
      return { activeChats, waitingChats, closedChats };
    }
    case "conversation_resumed": {
      activeChats = removeId(activeChats, cidOf(patch.summary));
      closedChats = removeId(closedChats, cidOf(patch.summary));
      return { activeChats, waitingChats, closedChats };
    }
    case "visitor_profile_updated": {
      const patchRow = (list: ConversationSummary[]) =>
        list.map((row) =>
          cidOf(row) === patch.conversationId.toLowerCase()
            ? patchRowPresentation(row, patch.visitorPresentation)
            : row,
        );
      return {
        activeChats: patchRow(activeChats),
        waitingChats: patchRow(waitingChats),
        closedChats: patchRow(closedChats),
      };
    }
    case "row_enrich": {
      return {
        activeChats: patchRowFields(
          activeChats,
          patch.conversationId,
          patch.fields,
        ),
        waitingChats: patchRowFields(
          waitingChats,
          patch.conversationId,
          patch.fields,
        ),
        closedChats: patchRowFields(
          closedChats,
          patch.conversationId,
          patch.fields,
        ),
      };
    }
    default:
      return { activeChats, waitingChats, closedChats };
  }
}
