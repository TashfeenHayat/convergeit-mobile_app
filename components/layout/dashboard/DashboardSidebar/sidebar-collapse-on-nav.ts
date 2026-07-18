/** Nav targets that auto-collapse the desktop sidebar on click (Agent inbox). */
export const AGENT_INBOX_HREF = "/dashboard/chat-operations";

export function shouldCollapseSidebarForNavHref(href: string): boolean {
  return href === AGENT_INBOX_HREF;
}
