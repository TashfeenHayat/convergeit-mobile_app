import { useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { isAttendanceMeTodaySnapshotKey } from "@/lib/hooks/query/hrms/attendance/keys";
import {
  agentMeetingIn,
  agentMeetingOut,
  fetchAgentChatSession,
  pauseAgentChatSession,
  startAgentChatSession,
  type AgentChatSessionPayload,
} from "@/services/chat/agent-chat-session.api";
import { extractApiErrorMessageForToast } from "@/lib/notify/extract-api-message";
import { publishAppToast } from "@/lib/notify";
import {
  publishAgentChatSessionActive,
  publishAgentChatSessionAttendance,
  publishAgentChatSessionPaused,
  setAgentChatSessionBusy,
  subscribeAgentChatSession,
  type AgentChatSessionState,
} from "./agent-chat-session-bus";

function isSessionApiMissing(err: unknown): boolean {
  return isAxiosError(err) && (err.response?.status === 404 || err.response?.status === 501);
}

function applySessionPayload(payload: AgentChatSessionPayload): void {
  const activity = payload.attendanceActivity ?? null;
  if (payload.status === "active" && payload.acceptingChats) {
    publishAgentChatSessionActive(activity);
  } else {
    publishAgentChatSessionPaused(activity);
  }
}

export function useAgentChatSession() {
  const token = useAccessToken() ?? "";
  const qc = useQueryClient();
  const [session, setSession] = useState<AgentChatSessionState>(() => ({
    status: "paused",
    acceptingChats: false,
    busy: false,
    attendanceActivity: null,
  }));

  useEffect(() => subscribeAgentChatSession(setSession), []);

  /** Chat session only affects today's snapshot — do not refetch full history lists. */
  const invalidateAttendance = useCallback(() => {
    void qc.invalidateQueries({
      predicate: (query) => isAttendanceMeTodaySnapshotKey(query.queryKey),
      refetchType: "active",
    });
  }, [qc]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void (async () => {
      try {
        const payload = await fetchAgentChatSession(token);
        if (cancelled) return;
        publishAgentChatSessionAttendance(payload.attendanceActivity ?? null);
        if (payload.status === "active" && payload.acceptingChats) {
          publishAgentChatSessionActive(payload.attendanceActivity ?? null);
        }
      } catch (err) {
        if (!isSessionApiMissing(err) && !cancelled) {
          /* non-fatal — local paused default remains */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const startSession = useCallback(async () => {
    if (session.status === "active" || session.busy) return;
    setAgentChatSessionBusy(true);
    try {
      let payload: AgentChatSessionPayload | null = null;
      if (token) {
        try {
          payload = await startAgentChatSession(token);
        } catch (err) {
          if (!isSessionApiMissing(err)) throw err;
        }
      }
      if (payload) {
        applySessionPayload(payload);
      } else {
        publishAgentChatSessionActive();
      }
      invalidateAttendance();
      publishAppToast({
        variant: "success",
        message: "Chat started — you can receive new conversations.",
      });
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err, "Could not start chat session."),
      });
    } finally {
      setAgentChatSessionBusy(false);
    }
  }, [invalidateAttendance, session.busy, session.status, token]);

  const pauseSession = useCallback(async () => {
    if (session.status === "paused" || session.busy) return;
    setAgentChatSessionBusy(true);
    try {
      let payload: AgentChatSessionPayload | null = null;
      if (token) {
        try {
          payload = await pauseAgentChatSession(token);
        } catch (err) {
          if (!isSessionApiMissing(err)) throw err;
        }
      }
      if (payload) {
        applySessionPayload(payload);
      } else {
        publishAgentChatSessionPaused();
      }
      invalidateAttendance();
      publishAppToast({
        variant: "success",
        message: "Chat paused — you are offline for new assignments.",
      });
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err, "Could not pause chat session."),
      });
    } finally {
      setAgentChatSessionBusy(false);
    }
  }, [invalidateAttendance, session.busy, session.status, token]);

  const meetingIn = useCallback(async () => {
    if (session.busy) return;
    const checkedIn =
      session.attendanceActivity?.hasOpenSession === true ||
      Boolean(session.attendanceActivity?.checkInAt?.trim());
    if (!checkedIn) {
      publishAppToast({
        variant: "error",
        message: "Check in before starting a meeting.",
      });
      return;
    }
    if (session.attendanceActivity?.onMeeting) return;
    setAgentChatSessionBusy(true);
    try {
      const payload = await agentMeetingIn(token);
      applySessionPayload(payload);
      invalidateAttendance();
      publishAppToast({ variant: "success", message: "Meeting started." });
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err, "Could not start meeting."),
      });
    } finally {
      setAgentChatSessionBusy(false);
    }
  }, [invalidateAttendance, session.attendanceActivity, session.busy, token]);

  const meetingOut = useCallback(async () => {
    if (session.busy || !session.attendanceActivity?.onMeeting) return;
    setAgentChatSessionBusy(true);
    try {
      const payload = await agentMeetingOut(token);
      applySessionPayload(payload);
      invalidateAttendance();
      publishAppToast({ variant: "success", message: "Meeting ended." });
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err, "Could not end meeting."),
      });
    } finally {
      setAgentChatSessionBusy(false);
    }
  }, [invalidateAttendance, session.attendanceActivity?.onMeeting, session.busy, token]);

  const onMeeting = useMemo(
    () => session.attendanceActivity?.onMeeting === true,
    [session.attendanceActivity?.onMeeting],
  );

  const canStartMeeting = useMemo(() => {
    const checkedIn =
      session.attendanceActivity?.hasOpenSession === true ||
      Boolean(session.attendanceActivity?.checkInAt?.trim());
    return checkedIn && !onMeeting;
  }, [onMeeting, session.attendanceActivity]);

  return {
    session,
    isAcceptingChats: session.status === "active" && session.acceptingChats,
    isPaused: session.status === "paused",
    onMeeting,
    canStartMeeting,
    startSession,
    pauseSession,
    meetingIn,
    meetingOut,
  };
}
