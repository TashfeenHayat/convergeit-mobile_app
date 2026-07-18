export type ShiftCoverageStatus = "ok" | "missing" | "not_applicable";

export interface ShiftCoverage {
  status: ShiftCoverageStatus;
  warnings: string[];
  missingDates: string[];
  requestId: string | null;
}
