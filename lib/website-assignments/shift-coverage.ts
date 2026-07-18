import { isRecord, unwrapApiData } from "@/lib/utils/core";
import type { ShiftCoverage, ShiftCoverageStatus } from "@/api/types/shift-coverage.types";

const VALID_STATUS = new Set<ShiftCoverageStatus>(["ok", "missing", "not_applicable"]);

function readShiftCoverage(rec: Record<string, unknown>): ShiftCoverage | null {
  const raw = rec.shiftCoverage;
  if (!raw || !isRecord(raw)) return null;
  const status = String(raw.status ?? "").trim() as ShiftCoverageStatus;
  if (!VALID_STATUS.has(status)) return null;
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
    : [];
  const missingDates = Array.isArray(raw.missingDates)
    ? raw.missingDates.filter((d): d is string => typeof d === "string" && d.trim().length > 0)
    : [];
  const requestId =
    raw.requestId == null || String(raw.requestId).trim() === ""
      ? null
      : String(raw.requestId).trim();
  return { status, warnings, missingDates, requestId };
}

/** Extract `shiftCoverage` from POST `/website-assignments` response envelope. */
export function extractShiftCoverageFromAssignResponse(payload: unknown): ShiftCoverage | null {
  const data = unwrapApiData(payload);
  if (isRecord(data)) return readShiftCoverage(data);
  if (isRecord(payload)) return readShiftCoverage(payload as Record<string, unknown>);
  return null;
}
