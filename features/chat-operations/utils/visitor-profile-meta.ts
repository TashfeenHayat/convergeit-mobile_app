import { agentDisplayName } from "@/services/chat/monitor-normalizers";
import type { MonitorAgentRef } from "@/services/chat/monitor.types";

function readString(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

export function formatProfileChatId(conversationId: string): string {
  const clean = conversationId.replace(/-/g, "").trim();
  if (!clean) return "—";
  return clean.length >= 6 ? clean.slice(-6) : clean;
}

export function formatProfileChatTimeUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function formatProfileChatDurationMinutes(startIso: string, endMs?: number): string {
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return "—";
  const end = endMs ?? Date.now();
  const mins = Math.max(1, Math.round((end - start) / 60000));
  return `${mins} min`;
}

export function readAgentLabelFromMeta(meta: Record<string, unknown> | null | undefined): string | null {
  if (!meta) return null;
  const agent = meta.agent;
  if (agent && typeof agent === "object") {
    return agentDisplayName(agent as MonitorAgentRef);
  }
  const nested = readString(meta, "assignedAgentName", "agentName", "agentDisplayName");
  return nested || null;
}

export function resolveChatStartedAt(
  meta: Record<string, unknown> | null | undefined,
  sessionStartedAt?: string,
): string {
  return (
    readString(meta, "startedAt", "started_at") ||
    sessionStartedAt?.trim() ||
    readString(meta, "createdAt", "created_at") ||
    ""
  );
}

export function resolveChatEndedAt(meta: Record<string, unknown> | null | undefined): string {
  return readString(meta, "endedAt", "ended_at", "closedAt", "closed_at");
}

export function isConversationClosed(meta: Record<string, unknown> | null | undefined): boolean {
  const status = readString(meta, "status");
  return status.toLowerCase() === "closed";
}
