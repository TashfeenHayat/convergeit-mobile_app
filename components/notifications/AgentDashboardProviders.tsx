import type { ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { isDashboardAccessToken } from "@/lib/auth/access-token";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { useAuthRealtimeBridge } from "@/lib/auth/useAuthRealtimeBridge";
import { isAuthSessionTerminated } from "@/api/session/terminate-auth-session";
import { useAgentSessionSockets } from "@/lib/hooks/chat/useAgentSessionSockets";
import { NotificationsProvider } from "@/lib/notifications/NotificationsContext";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";

/**
 * Dashboard realtime + notifications provider stack (mirrors web).
 */
export function AgentDashboardProviders({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const gates = useChatApiGates();
  const token = useAccessToken()?.trim() ?? "";
  const realtimeEnabled =
    isAuthenticated &&
    Boolean(token) &&
    isDashboardAccessToken(token) &&
    !isAuthSessionTerminated();
  const chatSocketEnabled = realtimeEnabled && (gates.agentInbox || gates.monitor);

  useAuthRealtimeBridge(realtimeEnabled, token);
  useAgentSessionSockets(chatSocketEnabled, {
    inboxDeltas: gates.agentInbox,
    respectChatSession: gates.agentInbox,
  });

  return <NotificationsProvider enabled={realtimeEnabled}>{children}</NotificationsProvider>;
}
