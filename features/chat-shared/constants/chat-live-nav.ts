import type { ChatLiveNavItem } from "../components/ChatLivePageHeader";

/** Core live triage — agent, monitor, QA inbox. */
export const CHAT_LIVE_NAV_ITEMS: ChatLiveNavItem[] = [
  { href: "/dashboard/chat-operations", label: "Agent inbox" },
  { href: "/dashboard/chat-monitor", label: "Monitor" },
  { href: "/dashboard/qa/inbox", label: "QA" },
];

/** Configuration & ops — not AI (AI stays in its own sidebar section). */
export const CHAT_CONFIGURE_NAV_ITEMS: ChatLiveNavItem[] = [
  { href: "/dashboard/qa/roster", label: "QA roster" },
  { href: "/dashboard/chat-reports", label: "Reports" },
  { href: "/dashboard/website-analytics", label: "Website analytics" },
  { href: "/dashboard/chat-widget", label: "Widget" },
  { href: "/dashboard/chat-settings", label: "Settings" },
  { href: "/dashboard/chat-canned", label: "Canned" },
  { href: "/dashboard/chat-involvement", label: "Involvement" },
];

/** @deprecated Use CHAT_LIVE_NAV_ITEMS or CHAT_CONFIGURE_NAV_ITEMS. */
export const CHAT_HUB_NAV_ITEMS: ChatLiveNavItem[] = [
  ...CHAT_LIVE_NAV_ITEMS,
  ...CHAT_CONFIGURE_NAV_ITEMS,
];
