export type FlowBuilderNodeType =
  | "trigger"
  | "intent"
  | "kb_search"
  | "condition"
  | "llm"
  | "bot_reply"
  | "handover"
  | "greeting"
  | "fallback";

export type FlowPaletteCategory = "entry" | "routing" | "knowledge" | "ai" | "actions";

export type FlowBuilderNode = {
  id: string;
  type: FlowBuilderNodeType;
  label: string;
  detail: string;
  x: number;
  y: number;
};

export type FlowBuilderEdge = {
  id: string;
  from: string;
  to: string;
  label?: string;
};

export type FlowBuilderGraph = {
  nodes: FlowBuilderNode[];
  edges: FlowBuilderEdge[];
};

export const FLOW_PALETTE_CATEGORIES: {
  id: FlowPaletteCategory;
  label: string;
}[] = [
  { id: "entry", label: "Entry" },
  { id: "routing", label: "Routing" },
  { id: "knowledge", label: "Knowledge" },
  { id: "ai", label: "AI" },
  { id: "actions", label: "Actions" },
];

export const FLOW_NODE_CATALOG: {
  type: FlowBuilderNodeType;
  label: string;
  detail: string;
  color: string;
  category: FlowPaletteCategory;
  icon: string;
}[] = [
  {
    type: "trigger",
    label: "Visitor message",
    detail: "When a visitor sends text",
    color: "#6366f1",
    category: "entry",
    icon: "chat",
  },
  {
    type: "intent",
    label: "Intent router",
    detail: "FAQ vs talk-to-agent",
    color: "#3b82f6",
    category: "routing",
    icon: "route",
  },
  {
    type: "greeting",
    label: "Greeting shortcut",
    detail: "Hi / hello fast path",
    color: "#8b5cf6",
    category: "routing",
    icon: "wave",
  },
  {
    type: "condition",
    label: "Confidence check",
    detail: "Score vs threshold",
    color: "#f59e0b",
    category: "routing",
    icon: "filter",
  },
  {
    type: "kb_search",
    label: "KB search",
    detail: "Search indexed training",
    color: "#eab308",
    category: "knowledge",
    icon: "search",
  },
  {
    type: "llm",
    label: "AI generate",
    detail: "LLM with KB context",
    color: "#a855f7",
    category: "ai",
    icon: "spark",
  },
  {
    type: "fallback",
    label: "Fallback reply",
    detail: "Template when unsure",
    color: "#f97316",
    category: "ai",
    icon: "warning",
  },
  {
    type: "handover",
    label: "Talk to agent",
    detail: "Human handover path",
    color: "#ef4444",
    category: "actions",
    icon: "agent",
  },
  {
    type: "bot_reply",
    label: "Bot response",
    detail: "Send answer to visitor",
    color: "#22c55e",
    category: "actions",
    icon: "send",
  },
];

/** Maps runtime pipeline step ids → builder node types for highlight. */
export const PIPELINE_STEP_TO_NODE_TYPE: Record<string, FlowBuilderNodeType> = {
  chat_mode: "intent",
  knowledge_scope: "intent",
  intent: "intent",
  talk_to_agent: "handover",
  kb_search: "kb_search",
  confidence: "condition",
  greeting: "greeting",
  fallback: "fallback",
  llm: "llm",
  reply: "bot_reply",
  scope: "kb_search",
  action: "llm",
  assistant: "llm",
  agent_only: "fallback",
  hybrid_agent_phase: "handover",
  live_page: "kb_search",
};
