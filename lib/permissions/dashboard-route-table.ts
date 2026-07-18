import type { DashboardNavItem, PagePermission, RouteRule } from "./dashboard-nav.types";
import { PAGE } from "./permission-constants";

/**
 * Single source of truth: backend page permission -> frontend route + icon.
 * One `page:*` per sidebar leaf screen.
 */
export const ROUTE_RULES: readonly RouteRule[] = [
  { permission: PAGE.DASHBOARD, href: "/dashboard", iconKey: "dashboard" },
  { permission: PAGE.DASHBOARD, href: "/dashboard/company-admin-dashboard", iconKey: "dashboard", prefixMatch: true },
  { permission: PAGE.DASHBOARD, href: "/dashboard/agent-dashboard", iconKey: "dashboard", prefixMatch: true },
  { permission: PAGE.DASHBOARD, href: "/dashboard/supervisor-dashboard", iconKey: "dashboard", prefixMatch: true },
  { permission: PAGE.DASHBOARD, href: "/dashboard/supper-dashboard", iconKey: "dashboard", prefixMatch: true },
  { permission: PAGE.DASHBOARD, href: "/dashboard/qa-dashboard", iconKey: "dashboard", prefixMatch: true },
  { permission: PAGE.DASHBOARD, href: "/dashboard/ai-management", iconKey: "dashboard", prefixMatch: true },

  { permission: PAGE.HRMS_ATTENDANCE_SELF, href: "/dashboard/attendance/my-attendance", iconKey: "reports" },
  { permission: PAGE.HRMS_ATTENDANCE_TEAM, href: "/dashboard/attendance/team-attendance", iconKey: "reports" },
  { permission: PAGE.HRMS_ATTENDANCE_MARK, href: "/dashboard/attendance/mark-attendance", iconKey: "reports" },
  { permission: PAGE.HRMS_LEAVE_TYPES, href: "/dashboard/leave/leave-type", iconKey: "leave" },
  { permission: PAGE.HRMS_LEAVE_APPLY, href: "/dashboard/leave/apply-leave", iconKey: "leave" },
  { permission: PAGE.HRMS_LEAVE_APPROVAL, href: "/dashboard/leave/approval-inbox", iconKey: "leave" },
  { permission: PAGE.HRMS_LEAVE_BALANCE, href: "/dashboard/leave/leave-balance", iconKey: "leave" },

  {
    permission: "page:account-setup",
    href: "/dashboard/companies",
    iconKey: "resellers",
    label: "Reseller management",
    prefixMatch: true,
  },
  {
    permission: "page:account-setup",
    href: "/dashboard/account-setup",
    iconKey: "accountSetup",
    prefixMatch: true,
  },
  {
    permission: "page:clients",
    href: "/dashboard/companies",
    iconKey: "clients",
    label: "Clients",
    prefixMatch: true,
  },
  {
    permission: "page:resellers",
    href: "/dashboard/companies",
    iconKey: "resellers",
    label: "Resellers",
    prefixMatch: true,
  },
  {
    permission: "page:account-setup",
    href: "/dashboard/services",
    iconKey: "resellers",
    label: "Services",
    prefixMatch: true,
    internalOnly: true,
  },
  {
    permission: "page:account-setup",
    href: "/dashboard/contract",
    iconKey: "resellers",
    label: "New contract",
    prefixMatch: true,
    internalOnly: true,
  },

  { permission: PAGE.USERS, href: "/dashboard/user-page", iconKey: "users", prefixMatch: false },
  { permission: PAGE.USERS, href: "/dashboard/organization-user", iconKey: "users", prefixMatch: true },
  { permission: PAGE.USERS_PERMISSIONS, href: "/dashboard/user-page/permissions", iconKey: "users", prefixMatch: false },
  { permission: PAGE.USERS_POC_LIST, href: "/dashboard/user-page/poc-list", iconKey: "users", prefixMatch: false },

  {
    permission: PAGE.WEBSITE_ASSIGNMENTS,
    href: "/dashboard/website-assigning",
    iconKey: "websiteAssignments",
    prefixMatch: true,
  },
  {
    permission: PAGE.WEBSITE_DIRECTORY,
    href: "/dashboard/websites",
    iconKey: "websiteAssignments",
    label: "Website directory",
    prefixMatch: false,
  },
  {
    permission: PAGE.WEBSITE_SERVICE_SCHEDULING,
    href: "/dashboard/website-assigning/service-schedules",
    iconKey: "websiteAssignments",
    label: "Service scheduling",
    prefixMatch: true,
  },
  {
    permission: PAGE.WEBSITE_INQUIRE_TOPICS,
    href: "/dashboard/website-assigning/inquire-topics",
    iconKey: "websiteAssignments",
    label: "Inquire topics",
    prefixMatch: true,
  },

  { permission: PAGE.ROLES, href: "/dashboard/roles", iconKey: "roles" },
  { permission: PAGE.DEPARTMENTS, href: "/dashboard/departments", iconKey: "departments" },
  { permission: PAGE.DESIGNATIONS, href: "/dashboard/designations", iconKey: "designations", label: "Designations" },
  {
    permission: PAGE.DEPARTMENT_HEADS,
    href: "/dashboard/hrms/department-heads",
    iconKey: "departments",
    label: "Department heads",
    prefixMatch: true,
  },

  { permission: PAGE.POOL, href: "/dashboard/pools", iconKey: "pools", label: "Pools", prefixMatch: true },
  {
    permission: PAGE.POOL_MEMBERS,
    href: "/dashboard/hrms/pool-members",
    iconKey: "pools",
    label: "Pool members",
    prefixMatch: true,
  },
  {
    permission: PAGE.POOL_HEADS,
    href: "/dashboard/hrms/pool-heads",
    iconKey: "pools",
    label: "Pool heads",
    prefixMatch: true,
  },

  { permission: PAGE.SHIFTS, href: "/dashboard/shifts", iconKey: "shifts", label: "Shifts", prefixMatch: false },
  {
    permission: PAGE.SHIFTS_DEPARTMENT,
    href: "/dashboard/shifts/department-shift",
    iconKey: "shifts",
    label: "Department shift",
  },
  { permission: PAGE.SHIFTS_POOL, href: "/dashboard/shifts/pool-shift", iconKey: "shifts", label: "Pool shift" },
  { permission: PAGE.SHIFTS_USER, href: "/dashboard/shifts/user-shift", iconKey: "shifts", label: "User shift" },

  { permission: PAGE.CHAT_INBOX, href: "/dashboard/chat-operations", iconKey: "chat", label: "Agent inbox", prefixMatch: true },
  { permission: PAGE.CHAT_MONITOR, href: "/dashboard/chat-monitor", iconKey: "chat", label: "Monitor", prefixMatch: true },
  {
    permission: PAGE.CHAT_TRANSCRIPTS,
    href: "/dashboard/chat-transcripts",
    iconKey: "chat",
    label: "Chat transcripts",
    prefixMatch: true,
  },
  { permission: PAGE.CHAT_QA, href: "/dashboard/qa/inbox", iconKey: "chat", label: "QA inbox", prefixMatch: true },
  { permission: PAGE.CHAT_QA, href: "/dashboard/chat-qa", iconKey: "chat", label: "QA inbox", prefixMatch: true },
  {
    permission: PAGE.CHAT_QA_ROSTER,
    href: "/dashboard/qa/roster",
    iconKey: "chat",
    label: "QA roster",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_QA_TEAM_REPORTS,
    href: "/dashboard/qa/team-quality",
    iconKey: "chat",
    label: "Team QA reports",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_REPORTS,
    href: "/dashboard/chat-reports",
    iconKey: "reports",
    label: "Chat reports",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_WEBSITE_ANALYTICS,
    href: "/dashboard/website-analytics",
    iconKey: "reports",
    label: "Website analytics",
    prefixMatch: true,
  },
  { permission: PAGE.CHAT_WIDGET, href: "/dashboard/chat-widget", iconKey: "chatWidget", label: "Widget", prefixMatch: true },
  {
    permission: PAGE.CHAT_CLOSE_POLICY,
    href: "/dashboard/chat-settings",
    iconKey: "chatWidget",
    label: "Chat settings",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_CANNED,
    href: "/dashboard/chat-canned",
    iconKey: "chatWidget",
    label: "Canned Messages",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_INVOLVEMENT,
    href: "/dashboard/chat-involvement",
    iconKey: "chatWidget",
    label: "Chat involvement",
    prefixMatch: true,
  },
  {
    permission: PAGE.CHAT_INTERNAL_SUPERVISORS,
    href: "/dashboard/chat-internal-supervisors",
    iconKey: "chatWidget",
    label: "Internal supervisors",
    prefixMatch: true,
  },
  {
    permission: PAGE.PHONE_NUMBER_SETUP,
    href: "/dashboard/phone-number-setup",
    iconKey: "chatWidget",
    label: "Text Us",
    prefixMatch: true,
  },

  {
    permission: PAGE.AI_ASSISTANT,
    href: "/dashboard/ai-training/assistant",
    iconKey: "aiTraining",
    label: "AI Assistant",
    prefixMatch: true,
  },
  {
    permission: PAGE.AI_COPILOT,
    href: "/dashboard/ai-training/copilot",
    iconKey: "aiTraining",
    label: "AI Copilot",
    prefixMatch: true,
  },
  {
    permission: PAGE.AI_CHATBOT,
    href: "/dashboard/ai-training/chatbot",
    iconKey: "aiTraining",
    label: "AI Chatbot",
    prefixMatch: true,
  },
  {
    permission: PAGE.AI_PLATFORM,
    href: "/dashboard/ai-training/platform-keys",
    iconKey: "aiTraining",
    label: "AI Configuration",
    prefixMatch: true,
  },

  { permission: "page:crm-integration", href: "/dashboard/crm-integration", iconKey: "crmIntegration", prefixMatch: true },
  { permission: "page:crm-integration", href: "/dashboard/crm-integrator", iconKey: "crmIntegration", prefixMatch: true },
  {
    permission: "page:distribution-setup",
    href: "/dashboard/distribution-setup",
    iconKey: "distributionSetup",
    prefixMatch: true,
  },
  { permission: "page:ip-blocklist", href: "/dashboard/ip-block-list", iconKey: "ipBlocklist", prefixMatch: true },
  { permission: "page:licenses", href: "/dashboard/license-generate", iconKey: "licenses" },

  { permission: PAGE.REPORTS, href: "/dashboard/reports", iconKey: "reports", prefixMatch: false },
  {
    permission: PAGE.REPORTS_CONFIGURATION,
    href: "/dashboard/reports/configuration",
    iconKey: "reports",
    label: "Reports Configuration",
    prefixMatch: true,
  },

  { permission: "page:billing", href: "/dashboard/billing", iconKey: "billing" },

  { permission: PAGE.SETTINGS, href: "/dashboard/settings", iconKey: "settings", prefixMatch: false },
  { permission: PAGE.SETTINGS_PROFILE, href: "/dashboard/settings/profile", iconKey: "settings", prefixMatch: false },
  {
    permission: PAGE.OBSERVABILITY_LOGS,
    href: "/dashboard/settings/logs",
    iconKey: "settings",
    label: "System logs",
    prefixMatch: true,
  },
  { permission: PAGE.SETTINGS_SECURITY, href: "/dashboard/security", iconKey: "settings", prefixMatch: true },

  {
    permission: PAGE.SMTP_EMAIL_RESELLER,
    href: "/dashboard/email/setup/reseller",
    iconKey: "smtpEmail",
    label: "Reseller mail",
    prefixMatch: true,
  },
  {
    permission: PAGE.SMTP_EMAIL_PLATFORM,
    href: "/dashboard/email/setup/platform",
    iconKey: "smtpEmail",
    label: "Platform mail",
  },
  {
    permission: PAGE.SMTP_EMAIL_ASSIGNMENT,
    href: "/dashboard/email/setup/assignment",
    iconKey: "smtpEmail",
    label: "Use platform mail",
  },
  {
    permission: PAGE.EMAIL_TEMPLATE_DESIGN,
    href: "/dashboard/email/design",
    iconKey: "smtpEmail",
    prefixMatch: true,
  },
  {
    permission: PAGE.EMAIL_TEMPLATE_PLATFORM,
    href: "/dashboard/email/design/platform",
    iconKey: "smtpEmail",
    label: "Platform design",
  },
  {
    permission: PAGE.EMAIL_TEMPLATE_FORMS,
    href: "/dashboard/email/forms",
    iconKey: "smtpEmail",
    label: "Email forms",
    prefixMatch: true,
  },
  { permission: PAGE.SMTP_EMAIL_RESELLER, href: "/dashboard/email", iconKey: "smtpEmail", prefixMatch: true },
  { permission: PAGE.SMTP_EMAIL_RESELLER, href: "/dashboard/email/setup", iconKey: "smtpEmail", prefixMatch: true },
  {
    permission: PAGE.SMTP_EMAIL_RESELLER,
    href: "/dashboard/smtp-email-integration",
    iconKey: "smtpEmail",
    prefixMatch: true,
  },

  {
    permission: "page:email-agent-feedback",
    href: "/dashboard/feedback",
    iconKey: "chat",
    label: "Feedback",
  },
  { permission: "page:social-media", href: "/dashboard/integrations", iconKey: "socialMedia" },
];

/** First matching rule wins so one `page:*` can map to a primary nav href while extra path rules share the same permission. */
export const ROUTE_RULE_BY_PERMISSION = new Map<PagePermission, RouteRule>(
  ROUTE_RULES.reduce((acc, rule) => {
    if (!acc.has(rule.permission)) acc.set(rule.permission, rule);
    return acc;
  }, new Map()),
);

/** Sidebar top-level order — one entry per nav group or flat item. */
export const PAGE_PERMISSION_ORDER: readonly PagePermission[] = [
  PAGE.DASHBOARD,
  PAGE.HRMS_OVERVIEW,
  "page:clients",
  PAGE.USERS,
  "page:account-setup",
  PAGE.WEBSITE_ASSIGNMENTS,
  PAGE.ROLES,
  PAGE.DEPARTMENTS,
  PAGE.POOL,
  PAGE.HRMS_ATTENDANCE_SELF,
  PAGE.CHAT_INBOX,
  PAGE.CHAT_WIDGET,
  PAGE.AI_ASSISTANT,
  "page:crm-integration",
  "page:distribution-setup",
  "page:ip-blocklist",
  "page:licenses",
  PAGE.REPORTS,
  "page:billing",
  PAGE.SETTINGS,
  PAGE.SMTP_EMAIL_RESELLER,
  "page:email-agent-feedback",
  "page:social-media",
  "page:resellers",
] as const;

/** `page:account-setup` | `page:clients` | `page:resellers` share one nav group (same `/dashboard/companies` tree). */
export const COMMERCIAL_PAGE_PERMISSIONS: readonly PagePermission[] = [
  "page:clients",
  "page:account-setup",
  "page:resellers",
];

export function firstCommercialPageInNavOrder(): PagePermission | null {
  for (const p of PAGE_PERMISSION_ORDER) {
    if (COMMERCIAL_PAGE_PERMISSIONS.includes(p)) return p;
  }
  return null;
}

/** Backend `page:*` keys we recognize (for `/dashboard/{segment}` → `page:{segment}` fallback). */
const KNOWN_PAGE_PERMISSION_KEYS = new Set<string>([
  ...(PAGE_PERMISSION_ORDER as readonly string[]),
  PAGE.HRMS_ATTENDANCE_SELF,
  PAGE.HRMS_ATTENDANCE_TEAM,
  PAGE.HRMS_ATTENDANCE_MARK,
  PAGE.HRMS_LEAVE_TYPES,
  PAGE.HRMS_LEAVE_APPLY,
  PAGE.HRMS_LEAVE_APPROVAL,
  PAGE.HRMS_LEAVE_BALANCE,
  PAGE.USERS_PERMISSIONS,
  PAGE.USERS_POC_LIST,
  PAGE.WEBSITE_DIRECTORY,
  PAGE.WEBSITE_SERVICE_SCHEDULING,
  PAGE.WEBSITE_INQUIRE_TOPICS,
  PAGE.DESIGNATIONS,
  PAGE.DEPARTMENT_HEADS,
  PAGE.POOL_MEMBERS,
  PAGE.POOL_HEADS,
  PAGE.SHIFTS_DEPARTMENT,
  PAGE.SHIFTS_POOL,
  PAGE.SHIFTS_USER,
  PAGE.CHAT_MONITOR,
  PAGE.CHAT_TRANSCRIPTS,
  PAGE.CHAT_QA,
  PAGE.CHAT_QA_ROSTER,
  PAGE.CHAT_QA_TEAM_REPORTS,
  PAGE.CHAT_REPORTS,
  PAGE.CHAT_WEBSITE_ANALYTICS,
  PAGE.CHAT_WIDGET,
  PAGE.CHAT_CLOSE_POLICY,
  PAGE.CHAT_CANNED,
  PAGE.CHAT_INVOLVEMENT,
  PAGE.CHAT_INTERNAL_SUPERVISORS,
  PAGE.PHONE_NUMBER_SETUP,
  PAGE.AI_CHATBOT,
  PAGE.AI_COPILOT,
  PAGE.AI_PLATFORM,
  PAGE.REPORTS_CONFIGURATION,
  PAGE.SETTINGS_PROFILE,
  PAGE.OBSERVABILITY_LOGS,
  PAGE.SETTINGS_SECURITY,
  PAGE.SMTP_EMAIL_PLATFORM,
  PAGE.SMTP_EMAIL_ASSIGNMENT,
  PAGE.EMAIL_TEMPLATE_DESIGN,
  PAGE.EMAIL_TEMPLATE_PLATFORM,
  PAGE.EMAIL_TEMPLATE_FORMS,
]);

/**
 * First path segment after `/dashboard/` maps to a page permission (`page:…`).
 * When the URL slug does not match the backend key (e.g. `user-page` vs `page:users`), use this map.
 */
const DASHBOARD_URL_SEGMENT_TO_PAGE: Readonly<Record<string, PagePermission>> = {
  hrms: PAGE.HRMS_OVERVIEW,
  attendance: PAGE.HRMS_ATTENDANCE_SELF,
  leave: PAGE.HRMS_LEAVE_APPLY,
  "user-page": PAGE.USERS,
  companies: "page:account-setup",
  "account-setup": "page:account-setup",
  "website-assigning": PAGE.WEBSITE_ASSIGNMENTS,
  websites: PAGE.WEBSITE_DIRECTORY,
  roles: PAGE.ROLES,
  departments: PAGE.DEPARTMENTS,
  designations: PAGE.DESIGNATIONS,
  pools: PAGE.POOL,
  shifts: PAGE.SHIFTS,
  "chat-operations": PAGE.CHAT_INBOX,
  "chat-monitor": PAGE.CHAT_MONITOR,
  "chat-transcripts": PAGE.CHAT_TRANSCRIPTS,
  qa: PAGE.CHAT_QA,
  "chat-qa": PAGE.CHAT_QA,
  "chat-reports": PAGE.CHAT_REPORTS,
  "chat-widget": PAGE.CHAT_WIDGET,
  "chat-settings": PAGE.CHAT_CLOSE_POLICY,
  "chat-canned": PAGE.CHAT_CANNED,
  "chat-involvement": PAGE.CHAT_INVOLVEMENT,
  "chat-internal-supervisors": PAGE.CHAT_INTERNAL_SUPERVISORS,
  "ai-training": PAGE.AI_ASSISTANT,
  "crm-integration": "page:crm-integration",
  "crm-integrator": "page:crm-integration",
  "distribution-setup": "page:distribution-setup",
  "phone-number-setup": PAGE.PHONE_NUMBER_SETUP,
  "ip-block-list": "page:ip-blocklist",
  "license-generate": "page:licenses",
  reports: PAGE.REPORTS,
  billing: "page:billing",
  settings: PAGE.SETTINGS,
  email: PAGE.SMTP_EMAIL_RESELLER,
  "smtp-email-integration": PAGE.SMTP_EMAIL_RESELLER,
  integrations: "page:social-media",
  "organization-user": PAGE.USERS,
  "company-admin-dashboard": PAGE.DASHBOARD,
  "agent-dashboard": PAGE.DASHBOARD,
  "supervisor-dashboard": PAGE.DASHBOARD,
  "supper-dashboard": PAGE.DASHBOARD,
  "qa-dashboard": PAGE.DASHBOARD,
  "ai-management": PAGE.DASHBOARD,
  security: PAGE.SETTINGS_SECURITY,
  feedback: "page:email-agent-feedback",
  "website-analytics": PAGE.CHAT_WEBSITE_ANALYTICS,
};

export function getFirstDashboardPathSegment(pathname: string): string | null {
  const clean = pathname.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const parts = clean.split("/").filter(Boolean);
  if (parts.length < 2 || parts[0] !== "dashboard") return null;
  return parts[1] ?? null;
}

/** Resolve required `page:*` from `/dashboard/{segment}/…` when no `ROUTE_RULES` row matched. */
export function requiredPagePermissionFromDashboardSegment(segment: string): PagePermission {
  const mapped = DASHBOARD_URL_SEGMENT_TO_PAGE[segment];
  if (mapped) return mapped;
  const literal = `page:${segment}`;
  if (KNOWN_PAGE_PERMISSION_KEYS.has(literal)) {
    return literal as PagePermission;
  }
  return PAGE.DASHBOARD;
}

function permissionToLabel(permission: PagePermission): string {
  return permission.replace(/^page:/, "");
}

export function toNavItem(permission: PagePermission): DashboardNavItem | null {
  const rule = ROUTE_RULE_BY_PERMISSION.get(permission);
  if (!rule) return null;
  return {
    href: rule.href,
    label: rule.label ?? permissionToLabel(permission),
    section: "activity",
    iconKey: rule.iconKey,
    permission,
    prefixMatch: rule.prefixMatch,
  };
}
