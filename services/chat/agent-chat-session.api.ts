import { apiClient } from "@/api";
import { chatAuthHeaders, unwrapChatHttpData } from "./http";

export type AgentChatSessionStatus = "paused" | "active";

export type AttendanceChatSessionSegment = {
  startedAt: string;
  pausedAt?: string | null;
};

export type AttendanceMeetingSegment = {
  meetingInAt: string;
  meetingOutAt?: string | null;
};

/** Today's attendance activity returned with agent session APIs. */
export type AgentAttendanceActivity = {
  chatSessions?: AttendanceChatSessionSegment[];
  meetings?: AttendanceMeetingSegment[];
  chatMinutes?: number | null;
  meetingMinutes?: number | null;
  chatStartedAt?: string | null;
  chatPausedAt?: string | null;
  chatActive?: boolean;
  meetingInAt?: string | null;
  meetingOutAt?: string | null;
  onMeeting?: boolean;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  hasOpenSession?: boolean;
  isOnBreak?: boolean;
  breakMinutesTaken?: number | null;
  workedMinutes?: number | null;
};

export type AgentChatSessionPayload = {
  status: AgentChatSessionStatus;
  acceptingChats: boolean;
  startedAt?: string | null;
  pausedAt?: string | null;
  attendanceActivity?: AgentAttendanceActivity | null;
};

export async function fetchAgentChatSession(token?: string): Promise<AgentChatSessionPayload> {
  const { data } = await apiClient.get<unknown>("/chat/agent/me/session", {
    headers: chatAuthHeaders(token),
  });
  return unwrapChatHttpData<AgentChatSessionPayload>(data);
}

export async function startAgentChatSession(token?: string): Promise<AgentChatSessionPayload> {
  const { data } = await apiClient.post<unknown>(
    "/chat/agent/me/session/start",
    undefined,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<AgentChatSessionPayload>(data);
}

export async function pauseAgentChatSession(token?: string): Promise<AgentChatSessionPayload> {
  const { data } = await apiClient.post<unknown>(
    "/chat/agent/me/session/pause",
    undefined,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<AgentChatSessionPayload>(data);
}

export async function agentMeetingIn(token?: string): Promise<AgentChatSessionPayload> {
  const { data } = await apiClient.post<unknown>(
    "/chat/agent/me/meeting/in",
    undefined,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<AgentChatSessionPayload>(data);
}

export async function agentMeetingOut(token?: string): Promise<AgentChatSessionPayload> {
  const { data } = await apiClient.post<unknown>(
    "/chat/agent/me/meeting/out",
    undefined,
    { headers: chatAuthHeaders(token) },
  );
  return unwrapChatHttpData<AgentChatSessionPayload>(data);
}
