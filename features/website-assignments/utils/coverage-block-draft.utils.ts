import type {
  DepartmentRosterCoverage,
  PutDepartmentRosterCoverageBody,
  RosterCoverageBlockInput,
} from "@/api/types/roster-coverage.types";
import type { SlotDraft } from "../components/RosterSlotPicker";
import { emptySlotDraft } from "../components/RosterSlotPicker";
import { draftToChannelBody, slotsFromRoster, tierListsEqual } from "./roster-draft.utils";
import {
  coerceTimeHm24,
  formatHm12Label,
  parseHmMinutes24,
  timesLikelyCrossMidnight,
} from "./schedule-time.utils";

export type CoverageBlockDraft = {
  id?: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  timezone: string;
  crossesMidnight: boolean;
  label: string;
  sortOrder: number;
  roster: SlotDraft;
};

function parseHm(hm: unknown): number {
  return parseHmMinutes24(hm) ?? 0;
}

function formatHm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function legacyDraftFromCoverage(data: DepartmentRosterCoverage): SlotDraft {
  return slotsFromRoster(data.legacyRoster);
}

export function blocksFromCoverage(data: DepartmentRosterCoverage): CoverageBlockDraft[] {
  return data.blocks.map((b, i) => ({
    id: b.id,
    startTime: coerceTimeHm24(b.startTime),
    endTime: coerceTimeHm24(b.endTime, "17:00"),
    daysOfWeek: [...b.daysOfWeek],
    timezone: b.timezone,
    crossesMidnight: b.crossesMidnight,
    label: b.label ?? `Period ${i + 1}`,
    sortOrder: b.sortOrder,
    roster: slotsFromRoster(b.roster),
  }));
}

export function splitServiceHoursIntoBlocks(
  hours: NonNullable<DepartmentRosterCoverage["chatServiceHours"]>,
  legacyRoster: SlotDraft,
): CoverageBlockDraft[] {
  const start = parseHm(hours.startTime);
  const end = parseHm(hours.endTime);
  const mid = Math.floor((start + end) / 2);
  const shared = {
    daysOfWeek: [...hours.daysOfWeek],
    timezone: hours.timezone,
    crossesMidnight: hours.crossesMidnight,
  };
  return [
    {
      ...shared,
      startTime: hours.startTime,
      endTime: formatHm(mid),
      label: "Morning coverage",
      sortOrder: 0,
      roster: { ...legacyRoster },
    },
    {
      ...shared,
      startTime: formatHm(mid),
      endTime: hours.endTime,
      label: "Afternoon coverage",
      sortOrder: 1,
      roster: emptySlotDraft(),
    },
  ];
}

export function newEmptyBlock(
  hours: DepartmentRosterCoverage["chatServiceHours"],
  sortOrder: number,
): CoverageBlockDraft {
  return {
    startTime: hours?.startTime ?? "09:00",
    endTime: hours?.endTime ?? "17:00",
    daysOfWeek: hours?.daysOfWeek?.length ? [...hours.daysOfWeek] : [1, 2, 3, 4, 5],
    timezone: hours?.timezone ?? "Asia/Karachi",
    crossesMidnight: hours?.crossesMidnight ?? false,
    label: `Block ${sortOrder + 1}`,
    sortOrder,
    roster: emptySlotDraft(),
  };
}

export function blocksToPutPayload(
  blocks: CoverageBlockDraft[],
): PutDepartmentRosterCoverageBody {
  return {
    useBlocks: true,
    blocks: blocks.map(
      (b, i): RosterCoverageBlockInput => ({
        id: b.id,
        startTime: coerceTimeHm24(b.startTime),
        endTime: coerceTimeHm24(b.endTime, "17:00"),
        daysOfWeek: b.daysOfWeek,
        timezone: b.timezone,
        crossesMidnight: Boolean(b.crossesMidnight),
        label: (typeof b.label === "string" ? b.label : "").trim() || null,
        sortOrder: b.sortOrder ?? i,
        roster: draftToChannelBody(b.roster),
      }),
    ),
  };
}

export function blocksDraftChanged(
  blocks: CoverageBlockDraft[],
  baseline: CoverageBlockDraft[],
): boolean {
  if (blocks.length !== baseline.length) return true;
  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i]!;
    const b = baseline[i]!;
    if (
      a.startTime !== b.startTime ||
      a.endTime !== b.endTime ||
      a.label !== b.label ||
      a.timezone !== b.timezone ||
      a.crossesMidnight !== b.crossesMidnight ||
      JSON.stringify(a.daysOfWeek) !== JSON.stringify(b.daysOfWeek)
    ) {
      return true;
    }
    for (const tier of ["Primary", "Secondary", "Backup"] as const) {
      if (!tierListsEqual(a.roster[tier], b.roster[tier])) return true;
    }
  }
  return false;
}

export function formatCoverageBlockHoursLabel(block: CoverageBlockDraft): string {
  const days =
    block.daysOfWeek.length > 0 ? block.daysOfWeek.join(", ") : "No days";
  return `${formatHm12Label(block.startTime)} – ${formatHm12Label(block.endTime)} (${block.timezone}) · days ${days}`;
}
