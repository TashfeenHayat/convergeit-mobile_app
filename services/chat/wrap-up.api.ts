import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";
import type { AgentWrapUpPayload, SubmitAgentWrapUpBody } from "./wrap-up.types";

export async function fetchAgentWrapUp(
  conversationId: string,
): Promise<AgentWrapUpPayload> {
  const { data } = await apiClient.get<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/wrap-up`,
  );
  return unwrapChatHttpData<AgentWrapUpPayload>(data);
}

export async function submitAgentWrapUp(
  conversationId: string,
  body: SubmitAgentWrapUpBody,
): Promise<unknown> {
  const { data } = await apiClient.post<unknown>(
    `/chat/agent/conversations/${encodeURIComponent(conversationId)}/wrap-up`,
    body,
  );
  return unwrapChatHttpData(data);
}
