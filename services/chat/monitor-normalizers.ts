import type { MonitorConversationRow } from "./monitor.types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function normalizeMonitorConversationRow(raw: unknown): MonitorConversationRow | null {
  if (!isRecord(raw)) return null;
  const id = String(raw.id ?? raw.conversationId ?? "").trim();
  if (!id) return null;

  return {
    ...(raw as unknown as MonitorConversationRow),
    id,
    websiteId: String(raw.websiteId ?? ""),
    visitorId: String(raw.visitorId ?? ""),
    agentId: raw.agentId == null ? null : String(raw.agentId),
    status: String(raw.status ?? "unknown"),
  };
}

export function normalizeMonitorConversationList(data: unknown): MonitorConversationRow[] {
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeMonitorConversationRow)
    .filter((row): row is MonitorConversationRow => Boolean(row));
}

export function agentDisplayName(agent: MonitorConversationRow["agent"]): string {
  if (!agent) return "Unassigned";
  const name = [agent.firstName, agent.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (agent.email?.trim()) return agent.email.trim();
  return agent.id.slice(0, 8);
}
