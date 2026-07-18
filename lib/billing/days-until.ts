export function daysUntilDate(endDate: string, now = new Date()): number {
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00Z`);
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
}
