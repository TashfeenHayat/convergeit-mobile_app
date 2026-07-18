import { CHAT_BUNDLE_OPTIONS } from "./chat-bundles";

/**
 * Suggested company cap for External clients (backend subset-matches bundles).
 * UI shows bundles first so admins are not confused by granular codes alone.
 */
export const CHAT_CLIENT_CAP_PRESET_NAMES: readonly string[] = [
  ...CHAT_BUNDLE_OPTIONS.map((b) => b.code),
  "chat:bundle:agent",
  "page:chat-inbox",
  "page:chat-monitor",
  "page:chat-transcripts",
  "page:chat-qa",
  "page:chat-qa-roster",
  "page:chat-qa-team-reports",
  "page:chat-reports",
  "page:chat-website-analytics",
  "page:chat-widget",
  "page:chat-close-policy",
  "page:chat-canned",
  "page:chat-involvement",
  "page:chat-internal-supervisors",
  "page:phone-number-setup",
  "page:ai-assistant",
  "page:ai-chatbot",
  "page:ai-copilot",
  "page:ai-platform",
  "chat-widget:view",
  "chat-widget:update",
  "chat:settings:manage",
  "chat-widget:create",
  "chat-widget:delete",
] as const;

export const CHAT_CLIENT_CAP_PRESET_LABELS: Record<string, string> = {
  "chat:bundle:agent": "Chat Agent bundle (replaces retired chat:access)",
  "page:chat-inbox": "Agent inbox",
  "page:chat-monitor": "Live chat monitor",
  "page:chat-transcripts": "Chat transcripts",
  "page:chat-qa": "QA inbox",
  "page:chat-qa-roster": "QA roster",
  "page:chat-qa-team-reports": "Team QA reports",
  "page:chat-reports": "Chat reports",
  "page:chat-website-analytics": "Website analytics",
  "page:chat-widget": "Chat widget",
  "page:chat-close-policy": "Close policy / chat settings",
  "page:chat-canned": "Canned messages",
  "page:chat-involvement": "Chat involvement",
  "page:chat-internal-supervisors": "Internal supervisors",
  "page:phone-number-setup": "Text Us",
  "page:ai-assistant": "AI Assistant training",
  "page:ai-chatbot": "AI chatbot training",
  "page:ai-copilot": "AI copilot setup",
  "page:ai-platform": "AI platform keys & profiles",
  "chat-widget:view": "View widget settings",
  "chat-widget:update": "Edit widget settings",
  "chat:settings:manage": "Full operations JSON",
  ...Object.fromEntries(CHAT_BUNDLE_OPTIONS.map((b) => [b.code, b.label])),
};
