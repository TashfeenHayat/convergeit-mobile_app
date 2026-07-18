import { isRecord } from "@/lib/utils/core";

export function formatTimeOnly(value: string): string {
  const raw = value.trim();
  if (!raw) return "—";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
}

export function formatAttendanceStatus(status: string): string {
  const s = status.trim().toLowerCase();
  if (s === "on_break") return "On break";
  if (s === "checked_in") return "Checked in";
  if (s === "checked_out") return "Checked out";
  return status.trim() || "—";
}

export type AttendanceDayState = {
  hasOpenSession: boolean;
  isOnBreak: boolean;
  isOnMeeting: boolean;
  chatActive: boolean;
  checkInAt: string;
  checkOutAt: string;
  breakMinutesTaken: number | null;
  breakMinutesAllowed: number | null;
  overBreakMinutes: number | null;
  workedMinutes: number | null;
  chatMinutes: number | null;
  meetingMinutes: number | null;
};

function pickStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickNum(row: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = row[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
}

/** Derive check-in session + break state from an attendance log API row. */
export function parseAttendanceDayState(row: Record<string, unknown>): AttendanceDayState {
  const status = pickStr(row, ["status"]).toLowerCase();
  const checkInAt = pickStr(row, ["checkInAt", "checkIn", "checkInTime"]);
  const checkOutAt = pickStr(row, ["checkOutAt", "checkOut", "checkOutTime"]);

  let hasOpenSession =
    status === "checked_in" || status === "on_break" || Boolean(checkInAt && !checkOutAt);

  const segments = Array.isArray(row["segments"]) ? row["segments"] : [];
  const lastSeg = segments.length > 0 ? segments[segments.length - 1] : null;
  if (isRecord(lastSeg)) {
    const segIn = pickStr(lastSeg, ["checkInAt"]);
    const segOut = pickStr(lastSeg, ["checkOutAt"]);
    if (segIn && !segOut) hasOpenSession = true;
    if (segOut) hasOpenSession = false;
  }

  let isOnBreak = status === "on_break";
  const breaks = Array.isArray(row["breaks"]) ? row["breaks"] : [];
  const lastBreak = breaks.length > 0 ? breaks[breaks.length - 1] : null;
  if (isRecord(lastBreak)) {
    const bin = pickStr(lastBreak, ["breakInAt"]);
    const bout = pickStr(lastBreak, ["breakOutAt"]);
    if (bin && !bout) isOnBreak = true;
  }

  let isOnMeeting = row["onMeeting"] === true;
  const meetings = Array.isArray(row["meetings"]) ? row["meetings"] : [];
  const lastMeeting = meetings.length > 0 ? meetings[meetings.length - 1] : null;
  if (isRecord(lastMeeting)) {
    const min = pickStr(lastMeeting, ["meetingInAt"]);
    const mout = pickStr(lastMeeting, ["meetingOutAt"]);
    if (min && !mout) isOnMeeting = true;
  }
  const meetingInAt = pickStr(row, ["meetingInAt"]);
  const meetingOutAt = pickStr(row, ["meetingOutAt"]);
  if (meetingInAt && !meetingOutAt) isOnMeeting = true;

  return {
    hasOpenSession,
    isOnBreak,
    isOnMeeting,
    chatActive: row["chatActive"] === true,
    checkInAt,
    checkOutAt,
    breakMinutesTaken: pickNum(row, ["breakMinutesTaken"]),
    breakMinutesAllowed: pickNum(row, ["breakMinutesAllowed"]),
    overBreakMinutes: pickNum(row, ["overBreakMinutes"]),
    workedMinutes: pickNum(row, ["workedMinutes"]),
    chatMinutes: pickNum(row, ["chatMinutes"]),
    meetingMinutes: pickNum(row, ["meetingMinutes"]),
  };
}

export function formatMinutesLabel(minutes: number | null | undefined): string {
  if (minutes == null || !Number.isFinite(minutes)) return "—";
  return `${minutes} min`;
}

export function formatChatAttendanceSummary(row: Record<string, unknown>): string {
  const minutes = pickNum(row, ["chatMinutes"]);
  if (minutes != null && minutes > 0) return formatMinutesLabel(minutes);
  if (row["chatActive"] === true) return "Active";
  const sessions = Array.isArray(row["chatSessions"]) ? row["chatSessions"] : [];
  if (sessions.length > 0) {
    return `${sessions.length} session${sessions.length === 1 ? "" : "s"}`;
  }
  const started = pickStr(row, ["chatStartedAt"]);
  if (started) return formatTimeOnly(started);
  return "—";
}

export function formatMeetingAttendanceSummary(row: Record<string, unknown>): string {
  const minutes = pickNum(row, ["meetingMinutes"]);
  if (minutes != null && minutes > 0) return formatMinutesLabel(minutes);
  if (row["onMeeting"] === true) return "In meeting";
  const meetingIn = pickStr(row, ["meetingInAt"]);
  const meetingOut = pickStr(row, ["meetingOutAt"]);
  if (meetingIn && meetingOut) {
    return `${formatTimeOnly(meetingIn)} – ${formatTimeOnly(meetingOut)}`;
  }
  if (meetingIn) return formatTimeOnly(meetingIn);
  const meetings = Array.isArray(row["meetings"]) ? row["meetings"] : [];
  if (meetings.length > 0) return `${meetings.length} meeting`;
  return "—";
}

export type AttendanceEnrichedColumns = {
  startChat: string;
  chatPause: string;
  login: string;
  logout: string;
  chatMinutes: string;
  meetingMinutes: string;
};

function chatTimesFromRow(row: Record<string, unknown>): {
  chatStart: string;
  chatPause: string;
  chatActive: boolean;
} {
  let chatStart = pickStr(row, ["chatStartedAt", "chatStartAt"]);
  let chatPause = pickStr(row, ["chatPausedAt", "chatPauseAt"]);
  const sessions = Array.isArray(row["chatSessions"]) ? row["chatSessions"] : [];
  const firstSession = sessions.length > 0 ? sessions[0] : null;
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  if (isRecord(firstSession) && !chatStart) {
    chatStart = pickStr(firstSession, ["startedAt", "chatStartedAt"]);
  }
  if (isRecord(lastSession)) {
    const lastPause = pickStr(lastSession, ["pausedAt", "chatPausedAt"]);
    if (lastPause) chatPause = lastPause;
  }
  const chatActive = row["chatActive"] === true;
  return { chatStart, chatPause, chatActive };
}

function authTimesFromRow(row: Record<string, unknown>): {
  loginAt: string;
  logoutAt: string;
  authActive: boolean;
} {
  let loginAt = pickStr(row, ["authLoginAt"]);
  let logoutAt = pickStr(row, ["authLogoutAt"]);
  const sessions = Array.isArray(row["authSessions"]) ? row["authSessions"] : [];
  const firstSession = sessions.length > 0 ? sessions[0] : null;
  const lastSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;
  if (isRecord(firstSession) && !loginAt) {
    loginAt = pickStr(firstSession, ["loginAt"]);
  }
  if (isRecord(lastSession)) {
    const lastLogout = pickStr(lastSession, ["logoutAt"]);
    if (lastLogout) logoutAt = lastLogout;
  }
  let authActive = row["authActive"] === true;
  if (!authActive && isRecord(lastSession)) {
    const lastLogin = pickStr(lastSession, ["loginAt"]);
    const lastSegLogout = pickStr(lastSession, ["logoutAt"]);
    if (lastLogin && !lastSegLogout) authActive = true;
  }
  return { loginAt, logoutAt, authActive };
}

export function mapAttendanceEnrichedColumns(row: Record<string, unknown>): AttendanceEnrichedColumns {
  const { chatStart, chatPause, chatActive } = chatTimesFromRow(row);
  const { loginAt, logoutAt, authActive } = authTimesFromRow(row);
  return {
    startChat: formatTimeOnly(chatStart),
    chatPause: chatPause ? formatTimeOnly(chatPause) : chatActive ? "Active" : "—",
    login: formatTimeOnly(loginAt),
    logout: logoutAt ? formatTimeOnly(logoutAt) : authActive ? "Active" : "—",
    chatMinutes: formatMinutesLabel(pickNum(row, ["chatMinutes"])),
    meetingMinutes: formatMinutesLabel(pickNum(row, ["meetingMinutes"])),
  };
}

export type AttendanceHeaderTimes = {
  checkIn: string | null;
  checkOut: string | null;
  hasAny: boolean;
};

export function parseAttendanceHeaderTimes(state: AttendanceDayState): AttendanceHeaderTimes {
  const checkIn =
    state.checkInAt && formatTimeOnly(state.checkInAt) !== "—"
      ? formatTimeOnly(state.checkInAt)
      : null;
  const checkOut =
    state.checkOutAt && formatTimeOnly(state.checkOutAt) !== "—"
      ? formatTimeOnly(state.checkOutAt)
      : null;
  return { checkIn, checkOut, hasAny: Boolean(checkIn || checkOut) };
}

export function formatHeaderAttendanceTimes(state: AttendanceDayState): string | null {
  const inTime = state.checkInAt ? formatTimeOnly(state.checkInAt) : "";
  const outTime = state.checkOutAt ? formatTimeOnly(state.checkOutAt) : "";
  if (inTime && outTime && inTime !== "—" && outTime !== "—") {
    return `Check-in ${inTime} · Check-out ${outTime}`;
  }
  if (inTime && inTime !== "—") return `Check-in ${inTime}`;
  if (outTime && outTime !== "—") return `Check-out ${outTime}`;
  return null;
}

export function formatBreakSummary(
  taken: number | null,
  allowed: number | null,
  over: number | null,
): string {
  const t = taken ?? 0;
  if (allowed == null) return `${t} min break`;
  const base = `${t} / ${allowed} min`;
  if (over != null && over > 0) return `${base} (+${over} over)`;
  return base;
}
