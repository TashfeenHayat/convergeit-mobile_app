import { apiClient } from "@/api";
import { unwrapChatHttpData } from "./http";

export type InvolvementGuestLinkRow = {
  id: string;
  conversationId: string;
  departmentId: string;
  recipientEmail: string;
  recipientEmails?: string[] | null;
  expiresAt: string;
  firstOpenedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  department?: { id: string; name?: string };
  conversation?: {
    status?: string;
    agent?: { id: string; firstName?: string | null; lastName?: string | null; email?: string };
  };
};

export async function fetchWebsiteInvolvementLinks(
  websiteId: string,
  limit = 40,
): Promise<InvolvementGuestLinkRow[]> {
  const { data } = await apiClient.get<unknown>(
    `/chat/involvement/websites/${encodeURIComponent(websiteId)}/guest-links`,
    { params: { limit } },
  );
  const raw = unwrapChatHttpData<unknown>(data);
  return Array.isArray(raw) ? (raw as InvolvementGuestLinkRow[]) : [];
}
