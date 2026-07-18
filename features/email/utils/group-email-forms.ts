import type { EmailFormListItem } from "@/api/email/email-forms.api";

export type EmailFormChildGroup = {
  key: string;
  parentCompany: string;
  childCompany: string;
  websites: EmailFormListItem[];
};

export type EmailFormResellerGroup = {
  key: string;
  resellerName: string;
  childGroups: EmailFormChildGroup[];
  websiteCount: number;
};

function childKey(item: EmailFormListItem): string {
  return `${item.parentCompany}::${item.childCompany}`;
}

function resellerKey(item: EmailFormListItem): string {
  return item.resellerName.trim() || "Unknown reseller";
}

export function groupEmailFormsByOrg(items: EmailFormListItem[]): EmailFormResellerGroup[] {
  const resellerMap = new Map<string, EmailFormResellerGroup>();

  for (const item of items) {
    const rKey = resellerKey(item);
    let reseller = resellerMap.get(rKey);
    if (!reseller) {
      reseller = {
        key: rKey,
        resellerName: item.resellerName,
        childGroups: [],
        websiteCount: 0,
      };
      resellerMap.set(rKey, reseller);
    }

    const cKey = childKey(item);
    let child = reseller.childGroups.find((g) => g.key === cKey);
    if (!child) {
      child = {
        key: cKey,
        parentCompany: item.parentCompany,
        childCompany: item.childCompany,
        websites: [],
      };
      reseller.childGroups.push(child);
    }

    child.websites.push(item);
    reseller.websiteCount += 1;
  }

  return [...resellerMap.values()]
    .map((r) => ({
      ...r,
      childGroups: r.childGroups
        .map((c) => ({
          ...c,
          websites: [...c.websites].sort((a, b) => a.website.localeCompare(b.website)),
        }))
        .sort((a, b) => a.childCompany.localeCompare(b.childCompany)),
    }))
    .sort((a, b) => a.resellerName.localeCompare(b.resellerName));
}
