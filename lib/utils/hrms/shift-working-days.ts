import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

/** API default Mon–Fri (bit 0 = Monday … bit 6 = Sunday). */
export const HRMS_DEFAULT_WORKING_DAYS_MASK = 31;

const MON_SUN_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Clamp HRMS bitmask to 1–127. */
export function clampWorkingDaysMask(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return HRMS_DEFAULT_WORKING_DAYS_MASK;
  const i = Math.trunc(n);
  if (i < 1 || i > 127) return HRMS_DEFAULT_WORKING_DAYS_MASK;
  return i;
}

/** Monday = 0 … Sunday = 6 (matches API bit positions). */
export function weekdayIndexMon0FromIsoInTimeZone(isoDate: string, timeZone: string): number | null {
  const s = isoDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const tz = timeZone.trim();
  if (!tz) return null;
  try {
    const d = dayjs.tz(`${s}T12:00:00`, tz);
    if (!d.isValid()) return null;
    const sun0 = d.day();
    return sun0 === 0 ? 6 : sun0 - 1;
  } catch {
    return null;
  }
}

export function isCalendarWorkingDayForMask(isoDate: string, mask: number, timeZone: string): boolean | null {
  const idx = weekdayIndexMon0FromIsoInTimeZone(isoDate, timeZone);
  if (idx == null) return null;
  const m = clampWorkingDaysMask(mask);
  return (m & (1 << idx)) !== 0;
}

export function toggleDayInWorkingDaysMask(mask: number, dayIndexMon0: number): number {
  if (dayIndexMon0 < 0 || dayIndexMon0 > 6) return clampWorkingDaysMask(mask);
  const m = clampWorkingDaysMask(mask);
  return m ^ (1 << dayIndexMon0);
}

export function formatWorkingDaysMaskHuman(mask: number): string {
  const m = clampWorkingDaysMask(mask);
  const on: string[] = [];
  for (let i = 0; i < 7; i++) {
    if (m & (1 << i)) on.push(MON_SUN_SHORT[i]);
  }
  return on.length ? on.join(", ") : "—";
}

export function workingWeekdaysFromApiRecord(obj: Record<string, unknown> | null): string[] | null {
  if (!obj) return null;
  const raw = obj["workingWeekdays"] ?? obj["working_weekdays"];
  if (!Array.isArray(raw)) return null;
  const out = raw.map((x) => String(x).trim()).filter(Boolean);
  return out.length ? out : null;
}

export function effectiveWorkingDaysMask(
  assignmentMask: unknown,
  templateMask: unknown,
): number {
  const a =
    assignmentMask === null || assignmentMask === undefined
      ? null
      : typeof assignmentMask === "number"
        ? assignmentMask
        : Number(assignmentMask);
  if (a != null && Number.isFinite(a) && a >= 1 && a <= 127) return Math.trunc(a);
  return clampWorkingDaysMask(templateMask);
}
