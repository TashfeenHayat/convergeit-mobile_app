/** System / seed departments that must not drive designation lookups or user defaults. */
const PLACEHOLDER_DEPARTMENT_IDS = new Set([
  "00000000-0000-0000-0000-000000000000",
  "00000000-0000-0000-0000-000000000001",
]);

export function isSelectableDepartmentId(id: string | undefined | null): boolean {
  const trimmed = String(id ?? "").trim().toLowerCase();
  if (!trimmed) return false;
  return !PLACEHOLDER_DEPARTMENT_IDS.has(trimmed);
}
