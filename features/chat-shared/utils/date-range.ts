function parseIsoDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const d = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function isoToCalendarDate(iso: string): string {
  if (!iso.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function calendarDateToIsoStart(date: string): string {
  if (!date.trim()) return "";
  const d = parseIsoDate(date);
  if (!d) return "";
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export function calendarDateToIsoEnd(date: string): string {
  if (!date.trim()) return "";
  const d = parseIsoDate(date);
  if (!d) return "";
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}
