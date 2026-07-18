/**
 * Product copy: agent copilot (internal) vs visitor widget AI (public thread).
 * Keeps training scope and UX labels aligned with backend KnowledgeScope.
 */

export const AGENT_COPILOT_TITLE = "Agent Copilot";

export const AGENT_COPILOT_TAB_LABEL = "Agent Copilot";

export const AGENT_COPILOT_SUBTITLE =
  "Inbox helper for agents — suggests replies from AI Assistant knowledge. Never auto-sends.";

export const AGENT_COPILOT_EMPTY_HINT =
  "Ask anything from your trained KB (policies, FAQs, SOPs) or use quick actions below. The live transcript is sent with each question.";

export const AGENT_COPILOT_WEBSITE_REQUIRED =
  "This conversation has no website id — pick a chat from the inbox so copilot can load internal knowledge.";

export const VISITOR_WIDGET_AI_FIELD_CAPTION =
  "Controls the visitor-facing bot in the widget (Hybrid / AI only). Separate from Agent Copilot in live chat.";

export const WIDGET_AI_TYPE_AGENT_NOTE =
  "Agent help in live chat always uses AI Assistant training, regardless of this setting.";

/** AI Management hub — short product descriptions */
export const AI_HUB_TITLE = "AI Management";

export const AI_HUB_SUBTITLE =
  "Train knowledge, configure chatbots, and set up agent copilot — each product has a clear role.";

export const AI_ASSISTANT_PRODUCT = {
  title: "AI Assistant",
  tagline: "Internal knowledge for your team",
  description:
    "Train websites with docs, FAQs, PDFs, and SOPs. Agents use this knowledge in live chat via Copilot.",
  audience: "For agents & support staff",
} as const;

export const AI_CHATBOT_PRODUCT = {
  title: "AI Chatbot",
  tagline: "Visitor-facing widget bot",
  description:
    "Train each website so the public chat widget can answer visitor questions from your content.",
  audience: "For website visitors",
} as const;

export const AI_COPILOT_PRODUCT = {
  title: "AI Copilot",
  tagline: "Inbox reply helper",
  description:
    "Ready when AI Assistant knowledge and chatbot LLM are configured. Suggests answers agents can insert.",
  audience: "For agents in live chat",
} as const;

export const AI_CONFIG_PRODUCT = {
  title: "AI Configuration",
  tagline: "Platform LLM keys & profiles",
  description:
    "Connect OpenAI, Anthropic, and other providers. Create profiles used by chatbot and copilot.",
  audience: "For admins",
} as const;

export const AI_PRODUCT_RELATIONSHIP_NOTE =
  "Assistant = what agents know · Chatbot = what visitors see · Copilot = agent helper that reads Assistant knowledge";
