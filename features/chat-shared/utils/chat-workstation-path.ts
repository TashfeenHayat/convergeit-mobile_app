/** Full-height live-chat workstations (inbox, monitor, transcript detail) — minimal screen chrome below dashboard header. */
const WORKSTATION_PREFIXES = ["/dashboard/chat-operations", "/dashboard/chat-monitor"] as const;

const WORKSTATION_EXCLUDED = ["/dashboard/chat-operations/distribution"] as const;

const TRANSCRIPT_DETAIL_PREFIX = "/dashboard/chat-transcripts/";

/** Main agent inbox queue — not distribution / wrap-up sub-routes. */
export function isDashboardAgentInboxPath(pathname: string): boolean {
  return pathname === "/dashboard/chat-operations";
}

export function isDashboardChatWorkstationPath(pathname: string): boolean {
  if (WORKSTATION_EXCLUDED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  if (
    pathname.startsWith(TRANSCRIPT_DETAIL_PREFIX) &&
    pathname.length > TRANSCRIPT_DETAIL_PREFIX.length
  ) {
    return true;
  }
  return WORKSTATION_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
