import type { CrmPlatformCode } from "./crm.constants";

export type { CrmPlatformCode };

export type CrmPlatformMeta = {
  code: CrmPlatformCode;
  name: string;
  logoSrc: string;
  accent: string;
  logoBg: string;
  blurb: string;
  /** Full-bleed circular brand mark (e.g. HubSpot orange disc) */
  logoFullBleed?: boolean;
  /** Transparent PNG — no tinted box or border */
  logoNoChrome?: boolean;
  /** Horizontal wordmark — wider container */
  logoWide?: boolean;
};

export const CRM_PLATFORM_META: Record<CrmPlatformCode, CrmPlatformMeta> = {
  hubspot: {
    code: "hubspot",
    name: "HubSpot",
    logoSrc: "/assets/images/crm/hubspot.svg",
    accent: "#ff7a59",
    logoBg: "transparent",
    logoFullBleed: true,
    logoNoChrome: true,
    blurb: "Form share link or private app token",
  },
  salesforce: {
    code: "salesforce",
    name: "Salesforce",
    logoSrc: "/assets/images/crm/salesforce.svg",
    accent: "#00a1e0",
    logoBg: "transparent",
    logoNoChrome: true,
    logoWide: true,
    blurb: "Web-to-Lead or API username + token",
  },
  zoho: {
    code: "zoho",
    name: "Zoho CRM",
    logoSrc: "/assets/images/crm/zoho.png",
    accent: "#226db4",
    logoBg: "transparent",
    logoNoChrome: true,
    logoWide: true,
    blurb: "Published web form URL",
  },
  dynamics365: {
    code: "dynamics365",
    name: "Dynamics 365",
    logoSrc: "/assets/images/crm/dynamics365.png",
    accent: "#5c2d91",
    logoBg: "transparent",
    logoNoChrome: true,
    logoWide: true,
    blurb: "Dataverse API or Power Automate webhook",
  },
  gohighlevel: {
    code: "gohighlevel",
    name: "Go High Level",
    logoSrc: "/assets/images/crm/gohighlevel.png",
    accent: "#0f2744",
    logoBg: "transparent",
    logoFullBleed: true,
    logoNoChrome: true,
    blurb: "Location API key or workflow webhook",
  },
};

export function getCrmPlatformMeta(code: string | null | undefined): CrmPlatformMeta | null {
  if (!code) return null;
  const key = code.trim().toLowerCase() as CrmPlatformCode;
  return CRM_PLATFORM_META[key] ?? null;
}
