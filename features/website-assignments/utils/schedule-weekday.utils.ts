import type { ServiceScheduleWindow } from "@/services/chat/service-scheduling.types";

export const WEEKDAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type WeekdayCode = (typeof WEEKDAY_CODES)[number];

export function parseWeekdayCode(raw: string | number): WeekdayCode | null {
  if (typeof raw === "number" && raw >= 0 && raw <= 6) {
    return WEEKDAY_CODES[raw] ?? null;
  }
  const s = String(raw).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (n >= 0 && n <= 6) return WEEKDAY_CODES[n] ?? null;
  }
  const lower = s.toLowerCase();
  const hit = WEEKDAY_CODES.find(
    (code) => code.toLowerCase() === lower || code.toLowerCase() === lower.slice(0, 3),
  );
  return hit ?? null;
}

export function normalizeDaysOfWeek(days: Array<string | number>): WeekdayCode[] {
  const out: WeekdayCode[] = [];
  for (const d of days) {
    const code = parseWeekdayCode(d);
    if (code && !out.includes(code)) out.push(code);
  }
  return out.length ? out : ["Mon", "Tue", "Wed", "Thu", "Fri"];
}

export function normalizeScheduleWindow(window: ServiceScheduleWindow): ServiceScheduleWindow {
  return {
    ...window,
    daysOfWeek: normalizeDaysOfWeek(window.daysOfWeek as Array<string | number>),
  };
}
