import type { AgentAiAction } from "@/api/ai/agent-suggest.api";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  action?: AgentAiAction;
  pending?: boolean;
  /** KB source labels when the API returns knowledgeMatches. */
  sources?: string[];
}
