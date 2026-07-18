function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format a Date to YYYY-MM-DD (local time). */
export function toIsoDateString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** ISO date strings (YYYY-MM-DD) compare lexicographically. */
export function isoDateInRange(dayIso: string, fromIso: string, toIso: string): boolean {
  return dayIso >= fromIso && dayIso <= toIso;
}

/**
 * Map shift start/end from API into `HH:mm` for `<input type="time">` (which rejects full ISO strings).
 * ISO instants are formatted in `timeZone` when provided (shift's IANA zone).
 */
export function shiftApiTimeToTimeInputValue(
  raw: string | undefined | null,
  timeZone?: string,
): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  if (!s.includes("T") && /^\d{1,2}:\d{2}/.test(s)) {
    const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(s);
    if (m) {
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (Number.isFinite(h) && Number.isFinite(min) && h >= 0 && h <= 23 && min >= 0 && min <= 59) {
        return `${pad2(h)}:${pad2(min)}`;
      }
    }
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";

  const base: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const tz = timeZone?.trim();
  let opts = base;
  if (tz) {
    try {
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric" }).format(d);
      opts = { ...base, timeZone: tz };
    } catch {
      opts = base;
    }
  }

  const parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(d);
  const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
  const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hh.padStart(2, "0")}:${mm.padStart(2, "0")}`;
}
