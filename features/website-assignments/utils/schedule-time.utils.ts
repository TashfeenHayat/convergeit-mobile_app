/** Normalize API or draft time to `HH:mm` for `<input type="time">`. */
export function toTimeInputValue(raw: string | undefined | null): string {
  return coerceTimeHm24(raw);
}

/** Persist 24h `HH:mm` from time input or any user entry. */
export function fromTimeInputValue(value: string): string {
  return coerceTimeHm24(value);
}

export type Meridiem = "AM" | "PM";

export type Time12Parts = {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
};

/** Safe 24h `HH:mm` from strings, numbers, or accidental change events. */
export function coerceTimeHm24(raw: unknown, fallback = "09:00"): string {
  if (raw == null) return fallback;
  if (typeof raw === "object") {
    const maybeEvent = raw as { target?: { value?: unknown } };
    if (maybeEvent.target?.value != null) {
      return coerceTimeHm24(maybeEvent.target.value, fallback);
    }
    return fallback;
  }
  const t = String(raw).trim();
  if (!t) return fallback;
  const hm = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (hm) {
    const h = Math.min(23, Math.max(0, Number(hm[1])));
    const m = Math.min(59, Math.max(0, Number(hm[2])));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return fallback;
}

export function parseHmMinutes24(raw: unknown): number | null {
  const hm = coerceTimeHm24(raw, "");
  if (!hm) return null;
  const [hStr, mStr] = hm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

export function hm24ToParts(raw: unknown): Time12Parts {
  const hm = coerceTimeHm24(raw);
  const [hStr, mStr] = hm.split(":");
  const hour24 = Number(hStr);
  const minute = Number(mStr);
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, meridiem };
}

export function partsToHm24(parts: Time12Parts): string {
  let hour24 = parts.hour12 % 12;
  if (parts.meridiem === "PM") hour24 += 12;
  if (parts.meridiem === "AM" && parts.hour12 === 12) hour24 = 0;
  return `${String(hour24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function formatHm12Label(raw: unknown): string {
  const { hour12, minute, meridiem } = hm24ToParts(raw);
  return `${hour12}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

export function setMeridiemOnHm24(raw: unknown, meridiem: Meridiem): string {
  const parts = hm24ToParts(raw);
  return partsToHm24({ ...parts, meridiem });
}

/** True when end is earlier than start on the same calendar day (overnight shift). */
export function timesLikelyCrossMidnight(startTime: unknown, endTime: unknown): boolean {
  const start = coerceTimeHm24(startTime);
  const end = coerceTimeHm24(endTime);
  return start !== end && end < start;
}
