export type EffectiveShiftSummary = {
  shiftId: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  workingDays: string[];
  breakMinutes: number | null;
};

export type RosterUserHrmsContext = {
  userId: string;
  shift: EffectiveShiftSummary | null;
  onLeaveToday: boolean;
  onBreakNow: boolean;
  onDutyNow: boolean;
  chatAvailableNow: boolean;
  unavailableReason: string | null;
};

export type WebsiteChannelServiceHours = {
  channel: "Internal" | "External";
  timezone: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  daysOfWeekLabels: string[];
  crossesMidnight: boolean;
};

export type DepartmentRosterHrmsContext = {
  hrmsEnabled: boolean;
  channel: "Internal" | "External";
  users: RosterUserHrmsContext[];
  websiteServiceHours?: WebsiteChannelServiceHours | null;
};

export type DepartmentRosterHrmsContextEnvelope = {
  success: boolean;
  data: DepartmentRosterHrmsContext;
};
