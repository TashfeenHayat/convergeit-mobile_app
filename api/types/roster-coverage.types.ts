import type {
  WebsiteAssignmentChannelRoster,
  ServiceChannel,
  ChannelRosterSlotsBody,
} from "./website-assignments.types";

export type RosterCoverageBlockRow = {
  id: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  daysOfWeekLabels: string[];
  timezone: string;
  crossesMidnight: boolean;
  label: string | null;
  sortOrder: number;
  roster: WebsiteAssignmentChannelRoster;
};

export type DepartmentRosterCoverage = {
  mode: "legacy" | "blocks";
  channel: ServiceChannel;
  chatServiceHours: {
    channel: string;
    timezone: string;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
    daysOfWeekLabels: string[];
    crossesMidnight: boolean;
  } | null;
  legacyRoster: WebsiteAssignmentChannelRoster;
  blocks: RosterCoverageBlockRow[];
};

export type RosterCoverageBlockInput = {
  id?: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone?: string;
  crossesMidnight?: boolean;
  label?: string | null;
  sortOrder?: number;
  roster: ChannelRosterSlotsBody;
};

export type PutDepartmentRosterCoverageBody = {
  useBlocks: boolean;
  blocks?: RosterCoverageBlockInput[];
};

export type DepartmentRosterCoverageEnvelope = {
  success: boolean;
  data: DepartmentRosterCoverage;
};
