import type { ChatMessage } from "@/services/chat/chat.types";

const POLICY_FORM_MESSAGE_TYPES = new Set(["close_form_link", "distribution_link", "distribution_setup_required"]);

function readMessageType(message: ChatMessage): string | null {
  const mt = message.metadata?.messageType;
  return typeof mt === "string" ? mt : null;
}

export function isSupervisorSentMessage(message: ChatMessage): boolean {
  if (message.metadata?.sentBySupervisor === true) return true;
  const att = message.metadata?.attachmentMetadata;
  if (att && typeof att === "object" && !Array.isArray(att)) {
    return (att as Record<string, unknown>).sentBySupervisor === true;
  }
  return false;
}

export function isDistributionFormMessage(message: ChatMessage): boolean {
  const type = readMessageType(message);
  return type != null && POLICY_FORM_MESSAGE_TYPES.has(type);
}

export function resolveMessageSenderLabel(
  message: ChatMessage,
  opts: {
    visitorDisplayName?: string;
    agentDisplayName?: string;
  } = {},
): string {
  const visitorDisplayName = opts.visitorDisplayName ?? "Visitor";
  const agentDisplayName = opts.agentDisplayName ?? "You";

  if (isDistributionFormMessage(message)) {
    return "Distribution close chat";
  }
  if (message.role === "ai") return "AI";
  if (message.role === "system") return "System";
  if (message.role === "visitor") return visitorDisplayName;
  if (isSupervisorSentMessage(message)) return "Supervisor";
  if (message.role === "agent") {
    return agentDisplayName;
  }
  return visitorDisplayName;
}
