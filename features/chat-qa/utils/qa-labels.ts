import type { QaUserLabel } from "@/services/chat/qa.types";

export function qaUserLabel(u?: QaUserLabel | null): string {
  if (!u) return "—";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || u.id.slice(0, 8);
}

export function queueRowTitle(row: {
  conversation?: {
    routingKey?: string | null;
    website?: { name?: string | null; childCompany?: { name?: string | null } };
    agent?: QaUserLabel | null;
  };
}): string {
  const site =
    row.conversation?.website?.name?.trim() ||
    row.conversation?.website?.childCompany?.name?.trim() ||
    "Chat";
  const agent = row.conversation?.agent ? qaUserLabel(row.conversation.agent) : null;
  const topic = row.conversation?.routingKey?.trim();
  if (topic) return `${site} · ${topic}`;
  if (agent) return `${site} · ${agent}`;
  return site;
}
