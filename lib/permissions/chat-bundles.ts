/**
 * Role editor stores these bundle codes; backend expands on `/auth/me`.
 * UI guards must use expanded `page` / `operational` arrays only — never client-expand bundles.
 */

export const CHAT_BUNDLE_OPTIONS = [
  {
    code: "chat:bundle:agent",
    label: "Chat Agent",
    description: "Inbox, reply, guest link, AI Assistant copilot",
  },
  {
    code: "chat:bundle:pool-head",
    label: "Pool Head",
    description: "Personal agent inbox + pool monitor, whisper, takeover",
  },
  {
    code: "chat:bundle:department-head",
    label: "Department Head",
    description: "Dept/pool monitor, whisper, takeover (no agent inbox)",
  },
  {
    code: "chat:bundle:team-lead",
    label: "Manager / Ops Lead",
    description: "Parent monitor, QA review, reports, settings view",
  },
  {
    code: "chat:bundle:qa",
    label: "Chat QA",
    description: "QA review screens (not full agent ops)",
  },
  {
    code: "chat:bundle:platform-monitor",
    label: "Platform monitor",
    description: "Cross-tenant chat monitor and audit (no agent inbox)",
  },
  {
    code: "chat:bundle:involvement-supervisor",
    label: "Involvement monitor",
    description: "Involvement user: website + dept monitor, guest link, whisper, takeover",
  },
  {
    code: "chat:bundle:internal-supervisor",
    label: "Internal supervisor",
    description: "Internal pool monitor, whisper, takeover, and agent inbox",
  },
] as const;

export type ChatBundleCode = (typeof CHAT_BUNDLE_OPTIONS)[number]["code"];

export function isChatBundleCode(code: string): boolean {
  return code.startsWith("chat:bundle:");
}

/** Granular chat ops expanded from bundles — hide in default role picker. */
export function isGranularChatPermissionCode(code: string): boolean {
  const c = code.trim();
  if (!c) return false;
  if (isChatBundleCode(c)) return false;
  if (c.startsWith("chat:")) return true;
  if (c.startsWith("qa:chat:")) return true;
  return false;
}

export function pickAssignedChatBundle(assigned: readonly string[]): ChatBundleCode | null {
  for (const opt of CHAT_BUNDLE_OPTIONS) {
    if (assigned.includes(opt.code)) return opt.code;
  }
  return null;
}
