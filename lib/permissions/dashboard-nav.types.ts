import type { PAGE } from "./permission-constants";

export type DashboardSidebarIconKey =
  | "accountSetup"
  | "billing"
  | "chat"
  | "chatWidget"
  | "aiTraining"
  | "clients"
  | "Reseller-Management"
  | "crmIntegration"
  | "dashboard"
  | "departments"
  | "designations"
  | "distributionSetup"
  | "hrms"
  | "ipBlocklist"
  | "licenses"
  | "leave"
  | "pools"
  | "reports"
  | "resellers"
  | "roles"
  | "settings"
  | "shifts"
  | "profile"
  | "theme"
  | "smtpEmail"
  | "socialMedia"
  | "users"
  | "websiteAssignments";

export type DashboardNavSection = "activity" | "footer";

export type DashboardNavItem = {
  href: string;
  label: string;
  section: DashboardNavSection;
  iconKey: DashboardSidebarIconKey;
  /** Backend PAGE permission, e.g. `page:users`. Null means always visible. */
  permission: string | null;
  /** Prefix match for dynamic routes such as `/dashboard/website-assigning/website/[websiteId]`. */
  prefixMatch?: boolean;
  /** Also highlight when pathname contains this substring (e.g. per-website scheduling editor). */
  pathIncludes?: string;
  /** With prefixMatch, do not highlight when pathname contains any of these substrings. */
  pathExcludes?: string[];
  /** Demo-only items (kept for existing seed/demo account behavior). */
  demoOnly?: boolean;
  /**
   * Parent row only: show when RBAC is on and the user has any of these page permissions.
   * Ignored when `permission` is set (flat items use `permission` only).
   */
  permissionsAny?: string[];
  /**
   * Child row only: show when user has any listed operational permission (OR).
   * When `permission` is also set, both page and operational gates apply.
   */
  operationalAny?: string[];
  /** Hide from sidebar unless the signed-in user is platform internal staff. */
  internalOnly?: boolean;
  /** Nested links (e.g. Departments + Designations under one sidebar dropdown). */
  children?: DashboardNavItem[];
};

type PageValue = (typeof PAGE)[keyof typeof PAGE];

export type PagePermission =
  | PageValue
  | "page:account-setup"
  | "page:billing"
  | "page:clients"
  | "page:crm-integration"
  | "page:distribution-setup"
  | "page:email-agent-feedback"
  | "page:ip-blocklist"
  | "page:licenses"
  | "page:resellers"
  | "page:social-media"
  | "page:access";

export type RouteRule = {
  permission: PagePermission;
  href: string;
  prefixMatch?: boolean;
  iconKey: DashboardSidebarIconKey;
  label?: string;
  /** Platform internal staff only — blocks reseller / external accounts on direct URL access. */
  internalOnly?: boolean;
};
