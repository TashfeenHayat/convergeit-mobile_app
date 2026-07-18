import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export function resolveBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Calendar date `YYYY-MM-DD` for `at` in the given IANA timezone. */
export function calendarDateInTimeZone(timeZone: string, at: Date = new Date()): string {
  const tz = timeZone.trim() || "UTC";
  try {
    return dayjs(at).tz(tz).format("YYYY-MM-DD");
  } catch {
    return dayjs(at).utc().format("YYYY-MM-DD");
  }
}
