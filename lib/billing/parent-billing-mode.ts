export const PARENT_BILLING_MODE_AGENCY = "agency_contract";
export const PARENT_BILLING_MODE_PER_WEBSITE = "per_website";

export function isParentOnAgencyContract(profile: {
  status?: string | null;
  invoiceToEmails?: string | null;
  parentOnAgencyContract?: boolean;
} | null | undefined): boolean {
  if (profile?.parentOnAgencyContract != null) return profile.parentOnAgencyContract;
  if (!profile) return false;
  const status = profile.status?.trim().toLowerCase() ?? "";
  if (status === PARENT_BILLING_MODE_PER_WEBSITE) return false;
  if (status === PARENT_BILLING_MODE_AGENCY) return true;
  if (status === "active" && profile.invoiceToEmails?.trim()) return true;
  return false;
}
