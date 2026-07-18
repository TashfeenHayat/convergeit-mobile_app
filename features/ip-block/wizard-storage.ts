const STORAGE_KEY = "converge:ip-block-wizard-draft";

export type IpBlockWizardDraft = {
  resellerId: string;
  parentCompanyId: string;
  childCompanyIds: string[];
  websiteIds: string[];
  ipAddress: string;
  reason: string;
  status: string;
  isActive: boolean;
};

export const emptyIpBlockWizardDraft = (): IpBlockWizardDraft => ({
  resellerId: "",
  parentCompanyId: "",
  childCompanyIds: [],
  websiteIds: [],
  ipAddress: "",
  reason: "",
  status: "block",
  isActive: true,
});

export function readIpBlockWizardDraft(): IpBlockWizardDraft {
  if (typeof window === "undefined") return emptyIpBlockWizardDraft();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyIpBlockWizardDraft();
    const parsed = JSON.parse(raw) as Partial<IpBlockWizardDraft>;
    return { ...emptyIpBlockWizardDraft(), ...parsed };
  } catch {
    return emptyIpBlockWizardDraft();
  }
}

export function writeIpBlockWizardDraft(draft: IpBlockWizardDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function clearIpBlockWizardDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
