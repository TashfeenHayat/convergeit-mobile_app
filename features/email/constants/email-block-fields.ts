import type { EmailTemplateBlockKey } from "./email-template-blocks";
import type { EmailFieldIconKey } from "./email-field-icon-library";

export type EmailFieldIconStyle = "mui" | "emoji" | "symbol" | "minimal";

export type EmailBlockFieldDef = {
  key: string;
  label: string;
  sampleKey: string;
  iconKey: EmailFieldIconKey;
  icons: Record<Exclude<EmailFieldIconStyle, "mui">, string>;
};

export const EMAIL_BLOCK_FIELD_CATALOG: Record<
  EmailTemplateBlockKey,
  EmailBlockFieldDef[]
> = {
  visitor_info: [
    { key: "name", label: "Name", sampleKey: "visitorName", iconKey: "person", icons: { emoji: "👤", symbol: "◆", minimal: "" } },
    { key: "email", label: "Email", sampleKey: "visitorEmail", iconKey: "email", icons: { emoji: "✉", symbol: "@", minimal: "" } },
    { key: "phone", label: "Phone", sampleKey: "visitorPhone", iconKey: "phone", icons: { emoji: "☎", symbol: "☎", minimal: "" } },
    { key: "company", label: "Company", sampleKey: "company", iconKey: "business", icons: { emoji: "🏢", symbol: "▪", minimal: "" } },
    { key: "location", label: "Location", sampleKey: "location", iconKey: "location", icons: { emoji: "📍", symbol: "◎", minimal: "" } },
    { key: "timezone", label: "Timezone", sampleKey: "timezone", iconKey: "schedule", icons: { emoji: "🕐", symbol: "◷", minimal: "" } },
    { key: "sessionId", label: "Session ID", sampleKey: "sessionId", iconKey: "tag", icons: { emoji: "🏷", symbol: "◈", minimal: "" } },
  ],
  chat_info: [
    { key: "website", label: "Website", sampleKey: "website", iconKey: "globe", icons: { emoji: "🌐", symbol: "◎", minimal: "" } },
    { key: "time", label: "Chat time", sampleKey: "chatTime", iconKey: "schedule", icons: { emoji: "🕐", symbol: "◷", minimal: "" } },
    { key: "agent", label: "Agent", sampleKey: "agentName", iconKey: "person", icons: { emoji: "👤", symbol: "◆", minimal: "" } },
    { key: "duration", label: "Chat duration", sampleKey: "duration", iconKey: "timer", icons: { emoji: "⏱", symbol: "◐", minimal: "" } },
    { key: "chatId", label: "Chat ID", sampleKey: "chatId", iconKey: "numbers", icons: { emoji: "#", symbol: "#", minimal: "" } },
  ],
  acquisition: [
    { key: "browser", label: "Browser", sampleKey: "browser", iconKey: "computer", icons: { emoji: "💻", symbol: "⌂", minimal: "" } },
    { key: "os", label: "Operating system", sampleKey: "os", iconKey: "android", icons: { emoji: "🖥", symbol: "◇", minimal: "" } },
    { key: "device", label: "Device", sampleKey: "device", iconKey: "devices", icons: { emoji: "📱", symbol: "▣", minimal: "" } },
    { key: "ip", label: "IP address", sampleKey: "ip", iconKey: "lan", icons: { emoji: "📡", symbol: "⬡", minimal: "" } },
    { key: "visitorId", label: "Visitor ID", sampleKey: "visitorId", iconKey: "person", icons: { emoji: "👤", symbol: "◆", minimal: "" } },
    { key: "leadSource", label: "Lead source", sampleKey: "leadSource", iconKey: "trending_up", icons: { emoji: "📈", symbol: "▲", minimal: "" } },
    { key: "chatOrigin", label: "Chat origin", sampleKey: "chatOrigin", iconKey: "chat", icons: { emoji: "💬", symbol: "◉", minimal: "" } },
    { key: "referrer", label: "Referrer", sampleKey: "referrer", iconKey: "link", icons: { emoji: "🔗", symbol: "⛓", minimal: "" } },
    { key: "landingPage", label: "Landing page", sampleKey: "landingPage", iconKey: "link", icons: { emoji: "🔗", symbol: "⛓", minimal: "" } },
    { key: "currentPage", label: "Current page", sampleKey: "currentPage", iconKey: "link", icons: { emoji: "🔗", symbol: "⛓", minimal: "" } },
    { key: "sessionStartedAt", label: "Session started", sampleKey: "sessionStartedAt", iconKey: "schedule", icons: { emoji: "🕐", symbol: "◷", minimal: "" } },
  ],
  transcript: [],
  additional_notes: [],
  visitor_feedback: [],
  visitor_journey: [],
  footer: [],
};

export const EMAIL_BLOCK_DEFAULT_TITLES: Record<EmailTemplateBlockKey, string> = {
  visitor_info: "Visitor Information",
  chat_info: "Chat Information",
  acquisition: "Acquisition",
  transcript: "Chat Transcript",
  additional_notes: "Additional Notes",
  visitor_feedback: "How would you rate this conversation?",
  visitor_journey: "Visitor Journey",
  footer: "Footer",
};

export type EmailBlockStyleJson = {
  showIcons?: boolean;
  title?: string;
  layout?: "grid" | "list";
  columns?: 1 | 2;
  /** @deprecated Field visibility is controlled in Email forms, not the design builder. */
  hiddenFields?: string[];
  iconStyle?: EmailFieldIconStyle;
};

export const DEFAULT_BLOCK_STYLE: Record<EmailTemplateBlockKey, EmailBlockStyleJson> = {
  visitor_info: { showIcons: true, layout: "list", columns: 1 },
  chat_info: { showIcons: true, layout: "grid", columns: 2 },
  acquisition: { showIcons: true, layout: "grid", columns: 2 },
  transcript: { showIcons: false, layout: "list", columns: 1 },
  additional_notes: { showIcons: false, layout: "list", columns: 1 },
  visitor_feedback: { showIcons: true, layout: "list", columns: 1 },
  visitor_journey: { showIcons: true, layout: "list", columns: 1 },
  footer: { showIcons: false, layout: "list", columns: 1 },
};

export function readBlockStyleJson(
  raw: Record<string, unknown> | null | undefined,
  blockKey: EmailTemplateBlockKey,
): Required<Pick<EmailBlockStyleJson, "showIcons" | "layout" | "columns">> & {
  title: string;
  hiddenFields: string[];
  iconStyle?: EmailFieldIconStyle;
} {
  const defaults = DEFAULT_BLOCK_STYLE[blockKey];
  const hidden = Array.isArray(raw?.hiddenFields)
    ? (raw!.hiddenFields as unknown[]).map(String)
    : [];

  const layout: "grid" | "list" =
    raw?.layout === "grid" || raw?.layout === "list"
      ? raw.layout
      : (defaults.layout ?? "list");

  const columns: 1 | 2 =
    raw?.columns === 2 ? 2 : raw?.columns === 1 ? 1 : layout === "grid" ? 2 : 1;

  const iconStyleRaw = raw?.iconStyle;
  const iconStyle: EmailFieldIconStyle | undefined =
    iconStyleRaw === "emoji" ||
    iconStyleRaw === "symbol" ||
    iconStyleRaw === "minimal" ||
    iconStyleRaw === "mui"
      ? iconStyleRaw
      : undefined;

  return {
    showIcons: raw?.showIcons !== false,
    title:
      typeof raw?.title === "string" && raw.title.trim()
        ? raw.title.trim()
        : EMAIL_BLOCK_DEFAULT_TITLES[blockKey],
    layout,
    columns,
    hiddenFields: hidden,
    iconStyle,
  };
}
