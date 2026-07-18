import { apiClient } from "@/api/http/axios-instance";
import { agentChatSocketAckOrRest } from "./agent-socket-api.util";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";
import type {
  GuestLinkRow,
  GuestLinkSendTarget,
  SendDepartmentGuestLinkBody,
  SendDepartmentGuestLinkResponse,
} from "./guest.types";

export async function getGuestLinkSendTarget(
  conversationId: string,
  _token?: string,
): Promise<GuestLinkSendTarget> {
  return agentChatSocketAckOrRest(
    (socket) => socket.fetchGuestLinkTargetWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/chat/conversations/${encodeURIComponent(conversationId)}/guest-link-target`,
      );
      return unwrapChatHttpData<GuestLinkSendTarget>(data);
    },
  );
}

export async function sendDepartmentGuestLink(
  conversationId: string,
  body: SendDepartmentGuestLinkBody | undefined,
  _token?: string,
): Promise<SendDepartmentGuestLinkResponse> {
  return agentChatSocketAckOrRest(
    (socket) =>
      socket.sendDepartmentGuestLinkWithAck(
        {
          conversationId,
          departmentId: body?.departmentId,
          email: body?.email,
        },
        20_000,
      ),
    async () => {
      const { data } = await apiClient.post<unknown>(
        `/chat/conversations/${encodeURIComponent(conversationId)}/send-department-link`,
        body ?? {},
      );
      return unwrapChatHttpData<SendDepartmentGuestLinkResponse>(data);
    },
  );
}

export async function listConversationGuestLinks(
  conversationId: string,
  _token?: string,
): Promise<GuestLinkRow[]> {
  return agentChatSocketAckOrRest(
    (socket) => socket.listConversationGuestLinksWithAck({ conversationId }, 15_000),
    async () => {
      const { data } = await apiClient.get<unknown>(
        `/chat/conversations/${encodeURIComponent(conversationId)}/guest-links`,
      );
      const unwrapped = unwrapChatHttpData<unknown>(data);
      return Array.isArray(unwrapped) ? (unwrapped as GuestLinkRow[]) : [];
    },
  );
}
