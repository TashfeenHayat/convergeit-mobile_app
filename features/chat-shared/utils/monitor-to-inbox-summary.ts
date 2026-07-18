import type { ConversationSummary } from "@/services/chat/chat.types";
import type { MonitorConversationRow } from "@/services/chat/monitor.types";

/** Map monitor list rows into agent-inbox queue shape (supervisor team view). */
export function monitorRowToConversationSummary(row: MonitorConversationRow): ConversationSummary {
  const agentId = row.agentId?.trim() || null;
  return {
    id: row.id,
    conversationId: row.id,
    websiteId: row.websiteId,
    departmentId: row.departmentId ?? null,
    status: row.status,
    visitorId: row.visitorId,
    assignedAgentId: agentId,
    agentId,
    visitorPresentation: row.visitorPresentation,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? null,
    lastMessage: row.lastMessage ?? undefined,
  };
}

export function monitorRowsToConversationSummaries(
  rows: MonitorConversationRow[],
): ConversationSummary[] {
  return rows.map(monitorRowToConversationSummary);
}
