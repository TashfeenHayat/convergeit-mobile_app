import { conversationIdFromSocketPayload } from "@/lib/hooks/chat/agent-chat.utils";
import {
  buildInboxPatchFromSocket,
  type InboxQueuePatch,
} from "@/lib/hooks/chat/agent-inbox-queue-patch";
import { normalizeSocketMessage } from "@/lib/hooks/chat/chat-socket-delivery";
import type { ConversationSummary } from "@/services/chat/chat.types";
import { normalizeMonitorConversationRow } from "@/services/chat/monitor-normalizers";
import type { MonitorConversationRow } from "@/services/chat/monitor.types";

function rowId(row: MonitorConversationRow): string {
  return row.id.trim().toLowerCase();
}

function removeRow(
  list: MonitorConversationRow[],
  conversationId: string,
): MonitorConversationRow[] {
  const needle = conversationId.trim().toLowerCase();
  return list.filter((row) => rowId(row) !== needle);
}

function mergeMonitorRows(
  existing: MonitorConversationRow | undefined,
  incoming: MonitorConversationRow,
): MonitorConversationRow {
  if (!existing) return incoming;
  return normalizeMonitorConversationRow({
    ...existing,
    ...incoming,
    id: incoming.id || existing.id,
    visitorPresentation: incoming.visitorPresentation ?? existing.visitorPresentation,
    agent: incoming.agent ?? existing.agent,
    department: incoming.department ?? existing.department,
    pool: incoming.pool ?? existing.pool,
  }) as MonitorConversationRow;
}

function upsertLiveRow(
  list: MonitorConversationRow[],
  row: MonitorConversationRow,
): MonitorConversationRow[] {
  const needle = rowId(row);
  if (!needle) return list;
  const existing = list.find((r) => rowId(r) === needle);
  const merged = mergeMonitorRows(existing, row);
  return [merged, ...list.filter((r) => rowId(r) !== needle)];
}

function patchLiveFields(
  list: MonitorConversationRow[],
  conversationId: string,
  fields: Partial<MonitorConversationRow>,
): MonitorConversationRow[] {
  const needle = conversationId.trim().toLowerCase();
  let changed = false;
  const next = list.map((row) => {
    if (rowId(row) !== needle) return row;
    changed = true;
    return mergeMonitorRows(row, {
      ...row,
      ...fields,
      id: row.id,
    });
  });
  return changed ? next : list;
}

function summaryToMonitorRow(summary: ConversationSummary): MonitorConversationRow | null {
  return normalizeMonitorConversationRow({
    ...summary,
    id: summary.id || summary.conversationId,
    conversationId: summary.conversationId ?? summary.id,
  });
}

export function buildMonitorPatchFromSocket(
  event: string,
  payload: unknown,
  conversationIdHint?: string,
): InboxQueuePatch | null {
  const ev = event.toLowerCase();
  const conversationId =
    conversationIdHint?.trim() ||
    conversationIdFromSocketPayload(payload) ||
    "";

  if (ev === "chat_supervisor_control" && conversationId) {
    const sc =
      payload && typeof payload === "object"
        ? (payload as { supervisorControlUserId?: string | null }).supervisorControlUserId
        : undefined;
    if (sc !== undefined) {
      return {
        kind: "row_enrich",
        conversationId,
        fields: { supervisorControlUserId: sc },
      };
    }
  }

  if (
    ev === "visitor_message" ||
    ev === "agent_message" ||
    ev === "ai_message" ||
    ev.includes("message")
  ) {
    if (!conversationId) return null;
    const messagePayload =
      payload && typeof payload === "object" && "message" in payload
        ? (payload as { message?: unknown }).message
        : payload;
    const normalized = normalizeSocketMessage(messagePayload, conversationId);
    const content = normalized?.content?.trim();
    if (!content) return null;
    return {
      kind: "row_enrich",
      conversationId,
      fields: {
        lastMessage: content,
        ...(normalized?.createdAt ? { lastMessageAt: normalized.createdAt } : {}),
      },
    };
  }

  if (ev === "typing" || ev === "stop_typing") {
    return null;
  }

  return buildInboxPatchFromSocket(ev, payload, undefined);
}

export function applyMonitorListPatch(
  live: MonitorConversationRow[],
  closed: MonitorConversationRow[],
  patch: InboxQueuePatch,
): { live: MonitorConversationRow[]; closed: MonitorConversationRow[] } {
  switch (patch.kind) {
    case "assigned_to_agent":
    case "queue_add": {
      const row = summaryToMonitorRow(patch.summary);
      if (!row) return { live, closed };
      const cid = rowId(row);
      return {
        live: upsertLiveRow(removeRow(live, cid), row),
        closed: removeRow(closed, cid),
      };
    }
    case "conversation_closed": {
      const cid = patch.conversationId.trim().toLowerCase();
      const existing =
        live.find((r) => rowId(r) === cid) ??
        closed.find((r) => rowId(r) === cid);
      const closedRow = existing
        ? mergeMonitorRows(existing, { ...existing, status: "closed" })
        : normalizeMonitorConversationRow({
            id: patch.conversationId,
            conversationId: patch.conversationId,
            websiteId: "",
            visitorId: "",
            agentId: null,
            status: "closed",
          });
      if (!closedRow) {
        return {
          live: removeRow(live, cid),
          closed,
        };
      }
      return {
        live: removeRow(live, cid),
        closed: upsertLiveRow(removeRow(closed, cid), closedRow),
      };
    }
    case "conversation_resumed": {
      const row = summaryToMonitorRow({
        ...patch.summary,
        status: "waiting",
        queuedForAgent: true,
      });
      if (!row) return { live, closed };
      const cid = rowId(row);
      return {
        live: upsertLiveRow(removeRow(live, cid), row),
        closed: removeRow(closed, cid),
      };
    }
    case "visitor_profile_updated": {
      const patchPresentation = (list: MonitorConversationRow[]) =>
        list.map((row) =>
          rowId(row) === patch.conversationId.toLowerCase()
            ? { ...row, visitorPresentation: patch.visitorPresentation }
            : row,
        );
      return {
        live: patchPresentation(live),
        closed: patchPresentation(closed),
      };
    }
    case "row_enrich": {
      const fields = patch.fields as Partial<MonitorConversationRow>;
      return {
        live: patchLiveFields(live, patch.conversationId, fields),
        closed: patchLiveFields(closed, patch.conversationId, fields),
      };
    }
    default:
      return { live, closed };
  }
}
