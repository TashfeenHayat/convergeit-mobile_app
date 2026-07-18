let focusedConversationId: string | null = null;

/** Track the conversation open in the agent inbox (suppress duplicate alerts). */
export function setAgentChatFocusedConversation(conversationId: string | null): void {
  focusedConversationId = conversationId?.trim() || null;
}

export function getAgentChatFocusedConversation(): string | null {
  return focusedConversationId;
}
