export function formatRosterShiftLabel(
  shift: {
    name: string;
    startTime: string;
    endTime: string;
    timezone: string;
    workingDays: string[];
  } | null | undefined,
): string {
  if (!shift) return "Assign HRMS shift first";
  const days =
    shift.workingDays.length > 0 ? shift.workingDays.join(", ") : "No working days";
  return `${shift.name}: ${shift.startTime}–${shift.endTime} (${shift.timezone}) · ${days}`;
}

export function formatWebsiteServiceHoursLabel(
  hours: {
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeekLabels: string[];
    crossesMidnight?: boolean;
  } | null | undefined,
): string | null {
  if (!hours) return null;
  const days =
    hours.daysOfWeekLabels.length > 0
      ? hours.daysOfWeekLabels.join(", ")
      : "No days configured";
  return `${hours.startTime}–${hours.endTime} (${hours.timezone}) · ${days}`;
}

/** How chat service / coverage block hours relate to an agent HRMS shift (overlap model). */
export function rosterScheduleOverlapHint(
  hasHrmsShift: boolean,
  channel: "Internal" | "External",
  inCoverageBlock = false,
): string {
  if (channel === "External") {
    return inCoverageBlock
      ? "External chats route during this coverage block within chat service hours."
      : "Chat service hours apply. External agents are eligible during those hours (no HRMS shift).";
  }
  if (hasHrmsShift) {
    return inCoverageBlock
      ? "Chats route only during this coverage block AND while the agent is on HRMS shift (break/leave skipped)."
      : "Chats route during chat service hours AND while the agent is on HRMS shift (break/leave skipped).";
  }
  return inCoverageBlock
    ? "Chats route during this coverage block within chat service hours. Assign an HRMS shift so internal agents receive chats only while on duty."
    : "Chats route during chat service hours. Assign an HRMS shift so the agent receives chats only while on duty.";
}

/** Empty when HRMS is off or channel is External — reseller without HRMS shows blank. */
export function formatSelectedUserShiftLine(
  hrms: {
    shift: {
      name: string;
      startTime: string;
      endTime: string;
      timezone: string;
      workingDays: string[];
    } | null;
  } | null | undefined,
  showHrmsShift: boolean,
): string | null {
  if (!showHrmsShift) return null;
  if (!hrms?.shift) return "Assign HRMS shift first";
  return formatRosterShiftLabel(hrms.shift);
}

export function rosterHrmsStatusLabel(ctx: {
  shift: unknown;
  onLeaveToday: boolean;
  onBreakNow: boolean;
  onDutyNow: boolean;
  chatAvailableNow: boolean;
  unavailableReason: string | null;
}): string {
  if (!ctx.shift) return "Assign shift in HRMS first";
  if (ctx.onLeaveToday) return "On leave today";
  if (ctx.onBreakNow) return "On break";
  if (ctx.chatAvailableNow) return "On duty now";
  return ctx.unavailableReason ?? "Off duty";
}

export function hrmsSchedulingHref(userId: string): string {
  return `/dashboard/shifts/user-shift?userId=${encodeURIComponent(userId)}`;
}