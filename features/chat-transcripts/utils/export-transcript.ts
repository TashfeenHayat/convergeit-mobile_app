import type { ChatMessage, ChatParticipantRole } from "@/services/chat/chat.types";

export type TranscriptExportMeta = {
  title: string;
  conversationId: string;
  agent?: string;
  website?: string;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  reseller?: string;
  parentCompany?: string;
  childCompany?: string;
};

function roleSenderLabel(role: ChatParticipantRole): string {
  switch (role) {
    case "visitor":
      return "Visitor";
    case "agent":
      return "Agent";
    case "ai":
      return "AI";
    case "system":
      return "System";
    default:
      return role;
  }
}

export function messageSenderLabel(msg: ChatMessage): string {
  if (msg.senderName?.trim()) return msg.senderName.trim();
  return roleSenderLabel(msg.role);
}

function formatTimestamp(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function safeFilenameBase(title: string): string {
  const base = title
    .replace(/[^\w\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return base.slice(0, 40) || "transcript";
}

export function transcriptExportFilename(meta: TranscriptExportMeta, ext: "xlsx" | "docx"): string {
  return `${safeFilenameBase(meta.title)}_${meta.conversationId.slice(0, 8)}.${ext}`;
}

/** Build plain-text export for mobile Share sheet. */
export function buildTranscriptPlainText(messages: ChatMessage[], meta: TranscriptExportMeta): string {
  const sorted = [...messages].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  const lines = [
    meta.title,
    `Chat ID: ${meta.conversationId}`,
    meta.agent ? `Agent: ${meta.agent}` : null,
    meta.website ? `Website: ${meta.website}` : null,
    meta.status ? `Status: ${meta.status}` : null,
    meta.startedAt ? `Started: ${formatTimestamp(meta.startedAt)}` : null,
    meta.endedAt ? `Ended: ${formatTimestamp(meta.endedAt)}` : null,
    "",
    "--- Messages ---",
    ...sorted.map((m) => {
      const ts = formatTimestamp(m.createdAt);
      return `[${ts}] ${messageSenderLabel(m)}: ${m.content}`;
    }),
  ].filter(Boolean);
  return lines.join("\n");
}

/** Web-only Excel export — not available on React Native. */
export function downloadTranscriptXlsx(_messages: ChatMessage[], _meta: TranscriptExportMeta): void {
  throw new Error("Excel export is available on the web dashboard only.");
}

/** Web-only Word export — not available on React Native. */
export async function downloadTranscriptDocx(_messages: ChatMessage[], _meta: TranscriptExportMeta): Promise<void> {
  throw new Error("Word export is available on the web dashboard only.");
}
