import type { FlowBuilderGraph } from "./ai-flow-builder.types";
import { autoLayoutFlowGraph } from "./ai-flow-layout.util";

const STORAGE_PREFIX = "converge.aiFlow.v1";

function storageKey(websiteId: string, variant: string): string {
  return `${STORAGE_PREFIX}.${variant}.${websiteId}`;
}

const DEFAULT_EDGES = [
  { id: "e1", from: "n-trigger", to: "n-intent" },
  { id: "e2", from: "n-intent", to: "n-greeting", label: "greeting" },
  { id: "e3", from: "n-intent", to: "n-kb" },
  { id: "e4", from: "n-intent", to: "n-handover", label: "agent" },
  { id: "e5", from: "n-greeting", to: "n-reply" },
  { id: "e6", from: "n-kb", to: "n-condition" },
  { id: "e7", from: "n-condition", to: "n-fallback", label: "low" },
  { id: "e8", from: "n-condition", to: "n-llm", label: "ok" },
  { id: "e9", from: "n-fallback", to: "n-reply" },
  { id: "e10", from: "n-llm", to: "n-reply" },
  { id: "e11", from: "n-handover", to: "n-reply" },
];

/** Clean spaced positions — used by reset and auto-arrange. */
export function defaultFlowGraph(): FlowBuilderGraph {
  return autoLayoutFlowGraph({
    nodes: [
      { id: "n-trigger", type: "trigger", label: "Visitor message", detail: "Incoming chat text", x: 0, y: 0 },
      { id: "n-intent", type: "intent", label: "Intent router", detail: "Classify question", x: 0, y: 0 },
      { id: "n-greeting", type: "greeting", label: "Greeting shortcut", detail: "Optional hi/hello path", x: 0, y: 0 },
      { id: "n-kb", type: "kb_search", label: "KB search", detail: "Website training index", x: 0, y: 0 },
      { id: "n-condition", type: "condition", label: "Confidence check", detail: "Threshold gate", x: 0, y: 0 },
      { id: "n-fallback", type: "fallback", label: "Fallback reply", detail: "Low confidence template", x: 0, y: 0 },
      { id: "n-llm", type: "llm", label: "AI generate", detail: "Gemini + KB context", x: 0, y: 0 },
      { id: "n-handover", type: "handover", label: "Talk to agent", detail: "Human request", x: 0, y: 0 },
      { id: "n-reply", type: "bot_reply", label: "Bot response", detail: "Deliver to visitor", x: 0, y: 0 },
    ],
    edges: DEFAULT_EDGES,
  });
}

export function loadFlowGraph(websiteId: string, variant: string): FlowBuilderGraph {
  if (typeof window === "undefined") return defaultFlowGraph();
  try {
    const raw = localStorage.getItem(storageKey(websiteId, variant));
    if (!raw) return defaultFlowGraph();
    const parsed = JSON.parse(raw) as FlowBuilderGraph;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return defaultFlowGraph();
    }
    return parsed;
  } catch {
    return defaultFlowGraph();
  }
}

export function saveFlowGraph(
  websiteId: string,
  variant: string,
  graph: FlowBuilderGraph,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(websiteId, variant), JSON.stringify(graph));
  } catch {
    /* quota */
  }
}
