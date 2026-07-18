import { apiClient } from "../http/axios-instance";
import { unwrapAiKnowledgeData } from "../ai-knowledge/unwrap";

export type WebsiteAiBehavior = {
  tone?: "PROFESSIONAL" | "FRIENDLY" | "SALES";
  confidenceThreshold: number | null;
  strictKbOnly: boolean;
  autoLearnFromVisitorPages: boolean;
  parallelScrapePages: boolean;
  greetingMessage: string | null;
  noMatchMessage: string | null;
  lowConfidenceMessage: string | null;
  llmErrorMessage: string | null;
  escalationMessage: string | null;
  partialMatchMessage: string | null;
  systemInstructions: string | null;
  chatbotInstructions: string | null;
  copilotInstructions: string | null;
};

export type AiTrainingTestContext = {
  websiteId: string;
  websiteName: string | null;
  websiteUrl: string;
  widgetKey: string | null;
  chatMode?: "AI_ONLY" | "HYBRID" | "AGENT_ONLY";
  talkToAgentEnabled?: boolean;
  defaultAiBehavior: WebsiteAiBehavior;
};

export type AiPipelineStep = {
  id: string;
  label: string;
  detail: string;
  status: "done" | "skipped" | "failed" | "warn";
  flowNodeId?: string;
};

export type FlowBuilderGraph = {
  nodes: {
    id: string;
    type: string;
    label: string;
    detail: string;
    x: number;
    y: number;
  }[];
  edges: {
    id: string;
    from: string;
    to: string;
    label?: string;
  }[];
};

export type AiTrainingKnowledgeMatch = {
  content: string;
  score: number;
  sourceRef?: string;
};

export type FlowExecutionStep = {
  nodeId: string;
  nodeType: string;
  nodeLabel: string;
  status: "done" | "skipped" | "failed" | "warn";
  detail: string;
  edgeId?: string;
  edgeLabel?: string;
  conditionResult?: string;
  output?: string;
};

export type AiTrainingTestRespondResult =
  | {
      variant: "chatbot";
      intent?: string;
      response: string;
      replySource?: string;
      knowledgeMatches?: AiTrainingKnowledgeMatch[];
      topKnowledgeMatch?: { content: string; score: number } | null;
      pipeline?: AiPipelineStep[];
      activeFlowNodeIds?: string[];
      activeFlowEdgeIds?: string[];
      flowExecution?: FlowExecutionStep[];
      flowExecutionErrors?: string[];
    }
  | {
      variant: "assistant";
      intent?: string;
      response: string;
      replySource?: string;
      knowledgeMatches?: AiTrainingKnowledgeMatch[];
      topKnowledgeMatch?: { content: string; score: number } | null;
      pipeline?: AiPipelineStep[];
      activeFlowNodeIds?: string[];
      activeFlowEdgeIds?: string[];
      flowExecution?: FlowExecutionStep[];
      flowExecutionErrors?: string[];
    };

export async function fetchAiTrainingBehavior(
  websiteId: string,
): Promise<WebsiteAiBehavior> {
  const { data } = await apiClient.get<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/behavior`,
  );
  return unwrapAiKnowledgeData<WebsiteAiBehavior>(data);
}

export async function patchAiTrainingBehavior(
  websiteId: string,
  body: Partial<WebsiteAiBehavior>,
): Promise<WebsiteAiBehavior> {
  const { data } = await apiClient.patch<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/behavior`,
    body,
  );
  return unwrapAiKnowledgeData<WebsiteAiBehavior>(data);
}

export async function fetchAiTrainingTestContext(
  websiteId: string,
): Promise<AiTrainingTestContext> {
  const { data } = await apiClient.get<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/test-context`,
  );
  return unwrapAiKnowledgeData<AiTrainingTestContext>(data);
}

export async function postAiTrainingTestRespond(body: {
  websiteId: string;
  variant: "chatbot" | "assistant";
  message: string;
  currentPageUrl?: string;
  /** Prior turns — `visitor:` / `ai:` lines; current message excluded. */
  history?: string[];
}): Promise<AiTrainingTestRespondResult> {
  const { data } = await apiClient.post<unknown>("/ai-training/test-respond", body);
  return unwrapAiKnowledgeData<AiTrainingTestRespondResult>(data);
}

export async function fetchAiTrainingAutomationFlow(
  websiteId: string,
  variant: "chatbot" | "assistant",
): Promise<FlowBuilderGraph> {
  const { data } = await apiClient.get<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/automation-flow`,
    { params: { variant } },
  );
  return unwrapAiKnowledgeData<FlowBuilderGraph>(data);
}

export async function patchAiTrainingAutomationFlow(
  websiteId: string,
  body: FlowBuilderGraph & { variant: "chatbot" | "assistant" },
): Promise<FlowBuilderGraph> {
  const { data } = await apiClient.patch<unknown>(
    `/ai-training/websites/${encodeURIComponent(websiteId)}/automation-flow`,
    body,
  );
  return unwrapAiKnowledgeData<FlowBuilderGraph>(data);
}
