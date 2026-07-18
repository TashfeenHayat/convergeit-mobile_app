import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import type { ChatMessage } from "@/services/chat/chat.types";

export function agentAiActionNeedsWebsite(action: AgentAiAction): boolean {
  return (
    action === "suggested_reply" ||
    action === "knowledge_lookup" ||
    action === "coach_reply" ||
    action === "rewrite_tone"
  );
}

function roleLabel(message: ChatMessage): string {
  if (message.role === "visitor") return "Visitor";
  if (message.role === "agent") {
    return message.senderName?.trim() ? `Agent (${message.senderName.trim()})` : "Agent";
  }
  return "AI";
}

/** Build `/ai/agent/suggest-reply` input with live transcript + draft (same KB as visitor AI). */
export function buildAgentCopilotInput(params: {
  prompt: string;
  action: AgentAiAction;
  transcript: ChatMessage[];
  draftReply?: string;
  maxTranscriptMessages?: number;
}): string {
  const prompt = params.prompt.trim();
  if (!prompt) return "";

  const blocks: string[] = [prompt];
  const recent = params.transcript.slice(-(params.maxTranscriptMessages ?? 24));
  const transcriptLines = recent
    .map((m) => {
      const content = m.content?.trim();
      if (!content) return "";
      return `${roleLabel(m)}: ${content}`;
    })
    .filter(Boolean);

  if (transcriptLines.length > 0) {
    blocks.push(
      "---",
      "Live chat transcript (most recent first in thread):",
      transcriptLines.join("\n"),
    );
  }

  const draft = params.draftReply?.trim();
  if (draft) {
    blocks.push("---", "Agent draft reply (not sent yet):", draft);
  }

  if (params.action === "knowledge_lookup") {
    blocks.push(
      "---",
      "Task: Answer from this website's trained knowledge base (same sources as the visitor AI Assistant).",
    );
  }

  if (params.action === "suggested_reply") {
    blocks.push(
      "---",
      "Task: Suggest a concise reply the agent can send to the visitor, grounded in KB when relevant.",
    );
  }

  return blocks.join("\n");
}
