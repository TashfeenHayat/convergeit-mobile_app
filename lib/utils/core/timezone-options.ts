const FALLBACK_TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
] as const;

/** IANA timezone options for searchable selects (service hours, shifts, etc.). */
export function getIanaTimezoneOptions(): { value: string; label: string }[] {
  try {
    const supported = (
      Intl as unknown as { supportedValuesOf?: (key: "timeZone") => string[] }
    ).supportedValuesOf?.("timeZone");
    const list =
      Array.isArray(supported) && supported.length > 0 ? supported : [...FALLBACK_TIMEZONES];
    return list.map((tz) => ({ value: tz, label: tz }));
  } catch {
    return FALLBACK_TIMEZONES.map((tz) => ({ value: tz, label: tz }));
  }
}

export function buildTimezoneSelectOptions(current?: string): { value: string; label: string }[] {
  const base = getIanaTimezoneOptions();
  const tz = current?.trim();
  const merged =
    tz && !base.some((o) => o.value === tz) ? [{ value: tz, label: tz }, ...base] : base;
  return [{ value: "", label: "Select timezone…" }, ...merged];
}
