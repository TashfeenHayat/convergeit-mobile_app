export type CannedTabId = "personal" | "website" | "all";

export const CANNED_PERSONAL = [
  "Sounds good!",
  "I'll be right back.",
  "Let me review the details.",
  "Thanks for your patience.",
  "Is there anything else I can help with?",
];

export const CANNED_WEBSITE = [
  "Thanks for reaching out.",
  "I'll check that for you now.",
  "Can you share any order ID?",
  "Our team typically responds within a few minutes.",
  "Would you like me to connect you with a specialist?",
];

export const CANNED_TAB_LABELS: Record<CannedTabId, string> = {
  personal: "Personal",
  website: "Website",
  all: "All replies",
};

export function getCannedMessagesForTab(tab: CannedTabId): string[] {
  if (tab === "personal") return CANNED_PERSONAL;
  if (tab === "website") return CANNED_WEBSITE;
  return [...CANNED_PERSONAL, ...CANNED_WEBSITE];
}
