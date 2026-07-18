import type { ChatLiveNavItem } from "@/features/chat-shared";
import { canAccessQaTeamReports } from "@/lib/permissions/chat-access";

export const QA_HUB_BASE = "/dashboard/qa";

export const QA_NAV_ITEMS: ChatLiveNavItem[] = [
  { href: `${QA_HUB_BASE}/inbox`, label: "Inbox" },
  { href: `${QA_HUB_BASE}/roster`, label: "Roster" },
  { href: `${QA_HUB_BASE}/team-quality`, label: "Team reports" },
];

export function buildQaNavItems(
  hasOperational: (permission: string) => boolean,
  isPlatformAdmin = false,
): ChatLiveNavItem[] {
  const items: ChatLiveNavItem[] = [
    { href: `${QA_HUB_BASE}/inbox`, label: "Inbox" },
    { href: `${QA_HUB_BASE}/roster`, label: "Roster" },
  ];
  if (canAccessQaTeamReports(hasOperational, isPlatformAdmin)) {
    items.push({ href: `${QA_HUB_BASE}/team-quality`, label: "Team reports" });
  }
  return items;
}
