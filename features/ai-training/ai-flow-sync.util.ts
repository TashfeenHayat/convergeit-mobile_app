import type { WebsiteAiBehavior } from "@/api/ai-training/ai-training.api";
import type { FlowBuilderGraph } from "./ai-flow-builder.types";
import { isCustomFlowNodeMessage } from "./ai-flow-node-inspector.config";

export type SimpleSetupDraft = {
  greetingMessage: string;
  notSureMessage: string;
  escalationMessage: string;
  confidenceThreshold: number;
  strictKbOnly: boolean;
  autoLearnFromVisitorPages: boolean;
  parallelScrapePages: boolean;
};

function nodeDetail(graph: FlowBuilderGraph | null | undefined, type: string): string {
  const node = graph?.nodes.find((n) => n.type === type);
  if (!node) return "";
  return isCustomFlowNodeMessage(node.detail) ? node.detail.trim() : "";
}

/** Merge behavior API + flow node overrides into one simple form draft. */
export function readSimpleSetupDraft(
  behavior: WebsiteAiBehavior,
  graph: FlowBuilderGraph | null | undefined,
): SimpleSetupDraft {
  const greeting =
    behavior.greetingMessage?.trim() ||
    nodeDetail(graph, "greeting") ||
    "";
  const notSure =
    behavior.lowConfidenceMessage?.trim() ||
    behavior.noMatchMessage?.trim() ||
    nodeDetail(graph, "fallback") ||
    "";
  const escalation =
    behavior.escalationMessage?.trim() ||
    nodeDetail(graph, "handover") ||
    "";

  return {
    greetingMessage: greeting,
    notSureMessage: notSure,
    escalationMessage: escalation,
    confidenceThreshold: behavior.confidenceThreshold ?? 0.26,
    strictKbOnly: behavior.strictKbOnly ?? false,
    autoLearnFromVisitorPages: behavior.autoLearnFromVisitorPages ?? false,
    parallelScrapePages: behavior.parallelScrapePages ?? false,
  };
}

/** Push simple setup text into matching flow nodes so runtime overrides stay in sync. */
export function applySimpleSetupToFlowGraph(
  graph: FlowBuilderGraph,
  draft: Pick<SimpleSetupDraft, "greetingMessage" | "notSureMessage" | "escalationMessage">,
): FlowBuilderGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.type === "greeting" && draft.greetingMessage.trim()) {
        return { ...node, detail: draft.greetingMessage.trim() };
      }
      if (node.type === "fallback" && draft.notSureMessage.trim()) {
        return { ...node, detail: draft.notSureMessage.trim() };
      }
      if (node.type === "handover" && draft.escalationMessage.trim()) {
        return { ...node, detail: draft.escalationMessage.trim() };
      }
      return node;
    }),
  };
}

export function simpleSetupToBehaviorBody(
  draft: SimpleSetupDraft,
): Partial<WebsiteAiBehavior> {
  return {
    confidenceThreshold: draft.confidenceThreshold,
    strictKbOnly: draft.strictKbOnly,
    autoLearnFromVisitorPages: draft.autoLearnFromVisitorPages,
    parallelScrapePages: draft.parallelScrapePages,
    greetingMessage: draft.greetingMessage.trim() || null,
    lowConfidenceMessage: draft.notSureMessage.trim() || null,
    noMatchMessage: draft.notSureMessage.trim() || null,
    escalationMessage: draft.escalationMessage.trim() || null,
  };
}
