import type { AiChatMessage } from "../types/ai-chat";

export type ConversationAiState = {
  messages: AiChatMessage[];
  prompt: string;
  busy: boolean;
};

export const EMPTY_AI_STATE: ConversationAiState = {
  messages: [],
  prompt: "",
  busy: false,
};

export function getConversationAiState(
  map: Record<string, ConversationAiState>,
  conversationId: string | null,
): ConversationAiState {
  if (!conversationId) return EMPTY_AI_STATE;
  return map[conversationId] ?? EMPTY_AI_STATE;
}

export function patchConversationAiState(
  map: Record<string, ConversationAiState>,
  conversationId: string,
  patch: Partial<ConversationAiState>,
): Record<string, ConversationAiState> {
  const current = map[conversationId] ?? EMPTY_AI_STATE;
  return {
    ...map,
    [conversationId]: { ...current, ...patch },
  };
}

export function getConversationDraft(map: Record<string, string>, conversationId: string | null): string {
  if (!conversationId) return "";
  return map[conversationId] ?? "";
}

export function patchConversationDraft(
  map: Record<string, string>,
  conversationId: string,
  value: string | ((prev: string) => string),
): Record<string, string> {
  const current = map[conversationId] ?? "";
  const next = typeof value === "function" ? value(current) : value;
  if (next === current) return map;
  return { ...map, [conversationId]: next };
}
