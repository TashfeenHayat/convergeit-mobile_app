export type QaAssignPreset = {
  websiteId: string;
  parentCompanyId?: string;
  childCompanyId?: string;
  resellerId?: string;
};

export function qaRosterAssignHref(preset?: QaAssignPreset | null): string {
  const base = "/dashboard/qa/roster/assign";
  if (!preset?.websiteId?.trim()) return base;
  const p = new URLSearchParams();
  p.set("websiteId", preset.websiteId.trim());
  const parent = preset.parentCompanyId?.trim();
  if (parent) p.set("parentCompanyId", parent);
  const child = preset.childCompanyId?.trim();
  if (child) p.set("childCompanyId", child);
  const reseller = preset.resellerId?.trim();
  if (reseller) p.set("resellerId", reseller);
  return `${base}?${p.toString()}`;
}
