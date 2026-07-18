import type { WidgetInstallChatMode } from "./widgetDraft";

/** PATCH `config.aiType` — prefer canonical API values. */
export type WidgetAiType = "AI_CHATBOT" | "AI_ASSISTANT";

export const WIDGET_AI_TYPE_OPTIONS: { label: string; value: WidgetAiType; description: string }[] = [
  {
    label: "AI Chatbot (Lite)",
    value: "AI_CHATBOT",
    description:
      "Visitor auto-replies: public site crawl + visitor FAQs. Default for website sales and support.",
  },
  {
    label: "AI Assistant (Pro)",
    value: "AI_ASSISTANT",
    description:
      "Visitor auto-replies use internal docs (PDF, SOP, internal FAQ). Use only if that content is safe for the public.",
  },
];

export function normalizeWidgetAiType(raw: unknown): WidgetAiType {
  const u = String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "_");
  if (u === "AI_ASSISTANT" || u === "ASSISTANT") return "AI_ASSISTANT";
  if (u === "AI_CHATBOT" || u === "CHATBOT") return "AI_CHATBOT";
  return "AI_CHATBOT";
}

export function shouldShowWidgetAiType(chatMode: WidgetInstallChatMode | string | undefined): boolean {
  const m = String(chatMode ?? "HYBRID").toUpperCase();
  return m === "AI_ONLY" || m === "HYBRID";
}

/** Merge `aiType` into PATCH/POST `config` when chat mode uses AI. */
export function applyAiTypeToWidgetConfig(
  config: Record<string, unknown>,
  draft: { chatMode?: WidgetInstallChatMode; aiType?: WidgetAiType },
): void {
  const chatMode = (draft.chatMode ?? "HYBRID") as WidgetInstallChatMode;
  if (!shouldShowWidgetAiType(chatMode)) return;
  config.aiType = normalizeWidgetAiType(draft.aiType);
}

export function parseAiTypeFromConfigRoot(root: Record<string, unknown>): WidgetAiType {
  const settings =
    root.settingsJson && typeof root.settingsJson === "object" && !Array.isArray(root.settingsJson)
      ? (root.settingsJson as Record<string, unknown>)
      : null;
  const raw =
    root.aiType ??
    root.ai_type ??
    settings?.aiType ??
    settings?.ai_type;
  return normalizeWidgetAiType(raw);
}
