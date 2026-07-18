import type { FlowBuilderNodeType } from "./ai-flow-builder.types";
import type { WebsiteAiBehavior } from "@/api/ai-training/ai-training.api";

export type FlowNodeRuntimeImpact = "none" | "message" | "settings";

export type FlowNodeInspectorConfig = {
  runtimeImpact: FlowNodeRuntimeImpact;
  runtimeBadge: string;
  whatItDoes: string;
  editHint: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  messageHelper?: string;
  /** Maps node detail → aiBehavior when custom (non-placeholder) text is set. */
  behaviorKeys?: (keyof WebsiteAiBehavior)[];
  settingsKey?: keyof WebsiteAiBehavior;
  settingsLabel?: string;
};

export const FLOW_NODE_INSPECTOR: Record<FlowBuilderNodeType, FlowNodeInspectorConfig> = {
  trigger: {
    runtimeImpact: "none",
    runtimeBadge: "Visual only",
    whatItDoes: "Marks where a visitor message enters the flow. The bot always starts here.",
    editHint: "Title is for your diagram only. Wiring does not change bot order yet.",
  },
  intent: {
    runtimeImpact: "none",
    runtimeBadge: "Visual only",
    whatItDoes:
      "Backend classifies intent automatically (FAQ, general, talk-to-agent) using fixed rules and trigger phrases.",
    editHint: "You cannot edit intent rules here. Test with messages like “talk to agent” to see this path.",
  },
  greeting: {
    runtimeImpact: "message",
    runtimeBadge: "Affects bot reply",
    whatItDoes: "When visitor sends a short hi/hello, bot can reply with your custom greeting instead of LLM.",
    editHint: "Write your greeting below. Auto-saves with the flow (~1 sec).",
    messageLabel: "Greeting message",
    messagePlaceholder: "Hello! Welcome to our site. How can I help you today?",
    messageHelper: "Saved to this flow and used at runtime (overrides empty platform default).",
    behaviorKeys: ["greetingMessage"],
  },
  kb_search: {
    runtimeImpact: "none",
    runtimeBadge: "Automatic",
    whatItDoes:
      "Always runs against this website’s indexed training (AI Training / KB). You control content in Training, not here.",
    editHint: "Ensure sources are indexed. This node highlights when KB search runs during a test.",
  },
  condition: {
    runtimeImpact: "settings",
    runtimeBadge: "Uses AI settings",
    whatItDoes:
      "Compares top KB match score to confidence threshold. Below threshold → fallback path; above → LLM path.",
    editHint: "Adjust threshold below or in AI settings (gear icon).",
    settingsKey: "confidenceThreshold",
    settingsLabel: "Confidence threshold",
  },
  llm: {
    runtimeImpact: "none",
    runtimeBadge: "Automatic",
    whatItDoes:
      "When confidence passes, Gemini generates an answer using KB context + your training. Model/prompt are platform-configured.",
    editHint: "Train good content. This node lights up when LLM runs in a test.",
  },
  fallback: {
    runtimeImpact: "message",
    runtimeBadge: "Affects bot reply",
    whatItDoes: "Used when KB match is weak, missing, or strict KB-only mode blocks LLM.",
    editHint: "Write the reply visitors should see when the bot is unsure.",
    messageLabel: "Fallback message",
    messagePlaceholder:
      "I’m not fully sure about that from our site content. Please ask another way or contact our team.",
    messageHelper: "Applies to low-confidence and no-match cases from this flow.",
    behaviorKeys: ["lowConfidenceMessage", "noMatchMessage"],
  },
  handover: {
    runtimeImpact: "message",
    runtimeBadge: "Affects bot reply",
    whatItDoes:
      "When visitor asks for a human (e.g. “talk to agent”), bot sends escalation text. Also depends on widget chat mode.",
    editHint: "Requires HYBRID mode + talk-to-agent enabled on widget for live handover.",
    messageLabel: "Talk to agent message",
    messagePlaceholder: "Connecting you with our team. A live agent will assist you shortly.",
    messageHelper: "Used when intent is talk-to-agent (test with “I want a human agent”).",
    behaviorKeys: ["escalationMessage"],
  },
  bot_reply: {
    runtimeImpact: "message",
    runtimeBadge: "Optional override",
    whatItDoes: "Final delivery step on the canvas. Optional fixed text for partial KB excerpt replies.",
    editHint: "Usually leave empty — LLM builds the answer. Set only if you want a fixed partial-match reply.",
    messageLabel: "Partial match message (optional)",
    messagePlaceholder: "Leave empty to use AI-generated answers from training.",
    messageHelper: "Maps to partial-match template when KB has a weak hit.",
    behaviorKeys: ["partialMatchMessage"],
  },
};

/** Same placeholders backend ignores — custom text must differ from these. */
export const FLOW_NODE_DEFAULT_DETAILS = new Set(
  [
    "when a visitor sends text",
    "faq vs talk-to-agent",
    "hi / hello fast path",
    "search indexed training",
    "score vs threshold",
    "template when unsure",
    "llm with kb context",
    "human handover path",
    "send answer to visitor",
    "incoming chat text",
    "classify question",
    "optional hi/hello path",
    "website training index",
    "threshold gate",
    "low confidence template",
    "gemini + kb context",
    "human request",
    "deliver to visitor",
  ].map((s) => s.toLowerCase()),
);

export function isCustomFlowNodeMessage(detail: string): boolean {
  const t = detail.trim();
  if (t.length < 4) return false;
  return !FLOW_NODE_DEFAULT_DETAILS.has(t.toLowerCase());
}
