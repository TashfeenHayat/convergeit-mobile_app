import type { AppTheme } from "@/theme/theme";
import { alpha } from "@mui/material/styles";
import { dashboardCardFill, dashboardSolidSurface } from "@/features/chat-operations/styles/chat-semantic";
import type { FlowBuilderNode, FlowBuilderNodeType } from "./ai-flow-builder.types";
import { isCustomFlowNodeMessage } from "./ai-flow-node-inspector.config";

/** Theme-safe text and surfaces for automation studio (works in light + dark dashboard). */
export function studioColors(theme: AppTheme) {
  const isLight = theme.palette.mode === "light";
  const d = theme.app.dashboard;
  const cardFill = dashboardCardFill(theme, isLight ? 0.96 : 0.9);
  const solid = dashboardSolidSurface(theme);
  return {
    isLight,
    text: isLight ? theme.app.text.primary : d.white95,
    textSecondary: d.textMuted,
    textSoft: isLight ? alpha(theme.app.text.primary, 0.65) : d.white80,
    surface: cardFill ?? solid,
    surfaceMuted: isLight
      ? alpha(theme.app.text.primary, 0.04)
      : alpha(d.overlayLight, 0.55),
    border: alpha(d.cardBorder, isLight ? 0.55 : 0.4),
    accent: d.accentBlue,
  };
}

/** Short labels shown on canvas nodes (not internal placeholders). */
export const FLOW_NODE_USER_SUBTITLE: Record<FlowBuilderNodeType, string> = {
  trigger: "Visitor sends a chat message",
  intent: "Detect: hello, question, or agent request",
  greeting: "Quick reply for hi / hello",
  kb_search: "Search your trained website content",
  condition: "Check if answer confidence is high enough",
  llm: "AI writes answer from training",
  fallback: "Reply when bot is not sure",
  handover: "Message before live agent",
  bot_reply: "Final message to visitor",
};

/** Subtitle shown on canvas blocks — friendly text, not internal placeholders. */
export function flowNodeDisplaySubtitle(node: FlowBuilderNode, maxLen = 52): string {
  if (isCustomFlowNodeMessage(node.detail)) {
    const custom = node.detail.trim();
    return custom.length > maxLen ? `${custom.slice(0, maxLen)}…` : custom;
  }
  const friendly = FLOW_NODE_USER_SUBTITLE[node.type];
  return friendly.length > maxLen ? `${friendly.slice(0, maxLen)}…` : friendly;
}

export const FLOW_BUILDER_GUIDE = {
  title: "How the chatbot works",
  steps: [
    {
      label: "1. Training",
      text: "Add your website & FAQs under AI Chatbot → Training. The bot answers from this content.",
    },
    {
      label: "2. Connect wires",
      text: "Drag from bottom dot ● to top dot ● of the next block. See the guide card on the canvas.",
    },
    {
      label: "3. Block details",
      text: "Use the preview icon on a block (top-right) to open its settings panel — not by clicking the block itself.",
    },
    {
      label: "4. Settings (gear icon)",
      text: "Control strictness and every fallback message the bot can send.",
    },
    {
      label: "5. Test chat",
      text: "Send messages on the right. Watch the diagram light up and read the Execution log below.",
    },
  ],
};

/** Shown when flow editing (wires, add-node, execution log) is hidden until Phase C. */
export const FLOW_BUILDER_GUIDE_READONLY = {
  title: "How the chatbot works",
  steps: [
    {
      label: "1. Training",
      text: "Add your website & FAQs under AI Chatbot → Training. The bot answers from this content.",
    },
    {
      label: "2. Quick setup",
      text: "Use Quick setup to set greeting, fallback, and handover messages — these go live on your widget.",
    },
    {
      label: "3. Flow overview",
      text: "The diagram shows how your bot is structured. Preview any block with the icon on the top-right.",
    },
    {
      label: "4. Settings (gear icon)",
      text: "Control strictness and every fallback message the bot can send.",
    },
    {
      label: "5. Test chat",
      text: "Send messages in the test widget. Replies use your indexed training data.",
    },
  ],
};
