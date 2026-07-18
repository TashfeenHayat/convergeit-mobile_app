/**
 * Shared page + operational permission codes (Converge SaaS).
 * Backend expands implied codes on `/auth/me` — UI mirrors page AND (operational OR).
 */

/** Default for every authenticated user — org-scope filter picker APIs only. */
export const SCOPE_FILTER_READ = "scope:filter:read" as const;

export const PAGE = {
  DASHBOARD: "page:dashboard",
  USERS: "page:users",
  USERS_PERMISSIONS: "page:users-permissions",
  USERS_POC_LIST: "page:users-poc-list",
  DEPARTMENTS: "page:departments",
  DESIGNATIONS: "page:designations",
  DEPARTMENT_HEADS: "page:department-heads",
  POOL: "page:pool",
  POOL_MEMBERS: "page:pool-members",
  POOL_HEADS: "page:pool-heads",
  HRMS_OVERVIEW: "page:hrms-overview",
  HRMS_ATTENDANCE_SELF: "page:hrms-attendance-self",
  HRMS_ATTENDANCE_TEAM: "page:hrms-attendance-team",
  HRMS_ATTENDANCE_MARK: "page:hrms-attendance-mark",
  HRMS_LEAVE_TYPES: "page:hrms-leave-types",
  HRMS_LEAVE_APPLY: "page:hrms-leave-apply",
  HRMS_LEAVE_APPROVAL: "page:hrms-leave-approval",
  HRMS_LEAVE_BALANCE: "page:hrms-leave-balance",
  SHIFTS: "page:shifts",
  SHIFTS_DEPARTMENT: "page:shifts-department",
  SHIFTS_POOL: "page:shifts-pool",
  SHIFTS_USER: "page:shifts-user",
  CHAT_INBOX: "page:chat-inbox",
  CHAT_MONITOR: "page:chat-monitor",
  CHAT_TRANSCRIPTS: "page:chat-transcripts",
  CHAT_QA: "page:chat-qa",
  CHAT_QA_ROSTER: "page:chat-qa-roster",
  CHAT_QA_TEAM_REPORTS: "page:chat-qa-team-reports",
  CHAT_REPORTS: "page:chat-reports",
  CHAT_WEBSITE_ANALYTICS: "page:chat-website-analytics",
  CHAT_WIDGET: "page:chat-widget",
  CHAT_CLOSE_POLICY: "page:chat-close-policy",
  CHAT_CANNED: "page:chat-canned",
  CHAT_INVOLVEMENT: "page:chat-involvement",
  CHAT_INTERNAL_SUPERVISORS: "page:chat-internal-supervisors",
  PHONE_NUMBER_SETUP: "page:phone-number-setup",
  AI_ASSISTANT: "page:ai-assistant",
  AI_CHATBOT: "page:ai-chatbot",
  AI_COPILOT: "page:ai-copilot",
  AI_PLATFORM: "page:ai-platform",
  ROLES: "page:roles",
  WEBSITE_ASSIGNMENTS: "page:website-assignments",
  WEBSITE_DIRECTORY: "page:website-directory",
  WEBSITE_SERVICE_SCHEDULING: "page:website-service-scheduling",
  WEBSITE_INQUIRE_TOPICS: "page:website-inquire-topics",
  SETTINGS: "page:settings",
  SETTINGS_PROFILE: "page:settings-profile",
  SETTINGS_SECURITY: "page:settings-security",
  OBSERVABILITY_LOGS: "page:observability:logs",
  REPORTS: "page:reports",
  REPORTS_CONFIGURATION: "page:reports-configuration",
  BILLING: "page:billing",
  SMTP_EMAIL_RESELLER: "page:smtp-email-reseller",
  SMTP_EMAIL_PLATFORM: "page:smtp-email-platform",
  SMTP_EMAIL_ASSIGNMENT: "page:smtp-email-assignment",
  EMAIL_TEMPLATE_DESIGN: "page:email-template-design",
  EMAIL_TEMPLATE_PLATFORM: "page:email-template-platform",
  EMAIL_TEMPLATE_FORMS: "page:email-template-forms",
} as const;

export const SHIFTS_PAGE_PERMISSIONS = [
  PAGE.SHIFTS,
  PAGE.SHIFTS_DEPARTMENT,
  PAGE.SHIFTS_POOL,
  PAGE.SHIFTS_USER,
] as const;

/** Full HRMS product (module ON) — parent sidebar gate. */
export const HRMS_MODULE_PAGE_PERMISSIONS = [PAGE.HRMS_OVERVIEW] as const;

/** Employee self-service pages — only under HRMS product when reseller bought `hrms`. */
export const WORKFORCE_PAGE_PERMISSIONS = [
  PAGE.HRMS_ATTENDANCE_SELF,
  PAGE.HRMS_ATTENDANCE_MARK,
  PAGE.HRMS_LEAVE_APPLY,
  PAGE.HRMS_LEAVE_BALANCE,
] as const;

/** HRMS module leaf pages (admin + shifts; workforce pages listed separately). */
export const HRMS_PAGE_PERMISSIONS = [
  PAGE.HRMS_OVERVIEW,
  PAGE.HRMS_ATTENDANCE_TEAM,
  PAGE.HRMS_LEAVE_TYPES,
  PAGE.HRMS_LEAVE_APPROVAL,
  ...SHIFTS_PAGE_PERMISSIONS,
] as const;

/** All HRMS product `page:*` keys (nav + route gate when module is off). */
export const HRMS_PRODUCT_PAGE_PERMISSIONS = [
  ...WORKFORCE_PAGE_PERMISSIONS,
  ...HRMS_PAGE_PERMISSIONS,
] as const;

const HRMS_PRODUCT_PAGE_PERMISSION_SET = new Set<string>(
  HRMS_PRODUCT_PAGE_PERMISSIONS,
);

/** True when a nav item maps to the sellable HRMS product (not base org structure). */
export function isHrmsProductPagePermission(permission: string): boolean {
  return HRMS_PRODUCT_PAGE_PERMISSION_SET.has(permission);
}

export const USERS_PAGE_PERMISSIONS = [
  PAGE.USERS,
  PAGE.USERS_PERMISSIONS,
  PAGE.USERS_POC_LIST,
] as const;

export const WEBSITE_PAGE_PERMISSIONS = [
  PAGE.WEBSITE_ASSIGNMENTS,
  PAGE.WEBSITE_DIRECTORY,
  PAGE.WEBSITE_SERVICE_SCHEDULING,
  PAGE.WEBSITE_INQUIRE_TOPICS,
] as const;

export const DEPARTMENTS_PAGE_PERMISSIONS = [
  PAGE.DEPARTMENTS,
  PAGE.DESIGNATIONS,
  PAGE.DEPARTMENT_HEADS,
] as const;

export const POOLS_PAGE_PERMISSIONS = [
  PAGE.POOL,
  PAGE.POOL_MEMBERS,
  PAGE.POOL_HEADS,
] as const;

export const LIVE_CHAT_PAGE_PERMISSIONS = [
  PAGE.CHAT_INBOX,
  PAGE.CHAT_MONITOR,
  PAGE.CHAT_TRANSCRIPTS,
  PAGE.CHAT_QA,
  PAGE.CHAT_QA_ROSTER,
  PAGE.CHAT_QA_TEAM_REPORTS,
  PAGE.CHAT_REPORTS,
  PAGE.CHAT_WEBSITE_ANALYTICS,
  PAGE.CHAT_CLOSE_POLICY,
  PAGE.CHAT_CANNED,
  PAGE.CHAT_INVOLVEMENT,
  PAGE.CHAT_INTERNAL_SUPERVISORS,
] as const;

/** Embeddable widget surfaces — separate sellable modules from live chat ops. */
export const VISITOR_CHANNELS_PAGE_PERMISSIONS = [
  PAGE.CHAT_WIDGET,
  PAGE.PHONE_NUMBER_SETUP,
] as const;

export const AI_PAGE_PERMISSIONS = [
  PAGE.AI_ASSISTANT,
  PAGE.AI_CHATBOT,
  PAGE.AI_COPILOT,
  PAGE.AI_PLATFORM,
] as const;

export const REPORTS_PAGE_PERMISSIONS = [PAGE.REPORTS, PAGE.REPORTS_CONFIGURATION] as const;

export const SETTINGS_PAGE_PERMISSIONS = [
  PAGE.SETTINGS,
  PAGE.SETTINGS_PROFILE,
  PAGE.SETTINGS_SECURITY,
  PAGE.OBSERVABILITY_LOGS,
] as const;

export const EMAIL_PAGE_PERMISSIONS = [
  PAGE.SMTP_EMAIL_RESELLER,
  PAGE.SMTP_EMAIL_PLATFORM,
  PAGE.SMTP_EMAIL_ASSIGNMENT,
  PAGE.EMAIL_TEMPLATE_DESIGN,
  PAGE.EMAIL_TEMPLATE_PLATFORM,
  PAGE.EMAIL_TEMPLATE_FORMS,
] as const;

export const SMTP_EMAIL_PAGE_PERMISSIONS = [
  PAGE.SMTP_EMAIL_RESELLER,
  PAGE.SMTP_EMAIL_PLATFORM,
  PAGE.SMTP_EMAIL_ASSIGNMENT,
] as const;

export const EMAIL_TEMPLATE_PAGE_PERMISSIONS = [
  PAGE.EMAIL_TEMPLATE_DESIGN,
  PAGE.EMAIL_TEMPLATE_PLATFORM,
  PAGE.EMAIL_TEMPLATE_FORMS,
] as const;

/** Org structure operational codes (`hrms:*` namespace) — granular only (umbrellas retired). */
export const ORG = {
  DEPT_MANAGE: [
    "hrms:department:create",
    "hrms:department:update",
    "hrms:department:view",
  ] as const,
  DESIGNATION_MANAGE: [
    "hrms:designation:create",
    "hrms:designation:update",
    "hrms:designation:view",
  ] as const,
  POOL_MANAGE: ["hrms:pool:create", "hrms:pool:update", "hrms:pool:view"] as const,
  ORG_MANAGE: [
    "hrms:department-head:create",
    "hrms:department-head:update",
    "hrms:department-head:view",
    "hrms:pool-head:create",
    "hrms:pool-head:update",
    "hrms:pool-head:view",
    "hrms:shift:create",
    "hrms:shift:update",
    "hrms:shift:view",
    "hrms:user-shift:assign",
    "hrms:department:create",
    "hrms:department:update",
    "hrms:department:view",
    "hrms:designation:create",
    "hrms:designation:update",
    "hrms:designation:view",
    "hrms:pool:create",
    "hrms:pool:update",
    "hrms:pool:view",
  ] as const,
  /** Replaces retired `hrms:org:structure:view`. */
  STRUCTURE_VIEW: [
    "hrms:department:view",
    "hrms:designation:view",
    "hrms:pool:view",
  ] as const,
  DEPT_VIEW: ["hrms:department:view"] as const,
  DESIGNATION_VIEW: ["hrms:designation:view"] as const,
  POOL_VIEW: ["hrms:pool:view"] as const,
  POOL_HEAD_VIEW: ["hrms:pool-head:view"] as const,
  POOL_MEMBER_ADD: ["hrms:pool:member:add"] as const,
  POOL_MEMBER_UPDATE: ["hrms:pool:member:update"] as const,
  POOL_MEMBER_REMOVE: ["hrms:pool:member:remove"] as const,
} as const;

/** HRMS workforce only (not org admin). */
export const HRMS = {
  ATTENDANCE_CHECKIN: "hrms:attendance:checkin",
  ATTENDANCE_CHECKOUT: "hrms:attendance:checkout",
  ATTENDANCE_BREAKIN: "hrms:attendance:breakin",
  ATTENDANCE_BREAKOUT: "hrms:attendance:breakout",
  ATTENDANCE_MEETING_IN: "hrms:attendance:meetingin",
  ATTENDANCE_MEETING_OUT: "hrms:attendance:meetingout",
  ATTENDANCE_SELF_VIEW: "hrms:attendance:self:view",
  ATTENDANCE_VIEW: "hrms:attendance:view",
  LEAVE_APPLY: "hrms:leave:apply",
  LEAVE_APPROVE_POOL: "hrms:leave:approve:pool",
  LEAVE_APPROVE_DEPT: "hrms:leave:approve:department",
  LEAVE_APPROVE_TENANT: "hrms:leave:approve:tenant",
  LEAVE_TYPE_MANAGE: "hrms:leave:type:manage",
  SHIFT_VIEW: "hrms:shift:view",
  SHIFT_CREATE: "hrms:shift:create",
  SHIFT_UPDATE: "hrms:shift:update",
  SHIFT_DELETE: "hrms:shift:delete",
  USER_SHIFT_ASSIGN: "hrms:user-shift:assign",
} as const;

/** Replaces retired `hrms:attendance:self` umbrella. */
export const HRMS_ATTENDANCE_SELF_ANY = [
  HRMS.ATTENDANCE_CHECKIN,
  HRMS.ATTENDANCE_CHECKOUT,
  HRMS.ATTENDANCE_BREAKIN,
  HRMS.ATTENDANCE_BREAKOUT,
  HRMS.ATTENDANCE_MEETING_IN,
  HRMS.ATTENDANCE_MEETING_OUT,
  HRMS.ATTENDANCE_SELF_VIEW,
] as const;

export const HRMS_LEAVE_APPROVE_ANY = [
  HRMS.LEAVE_APPROVE_POOL,
  HRMS.LEAVE_APPROVE_DEPT,
  HRMS.LEAVE_APPROVE_TENANT,
] as const;

/** Shift assignment screens — `hrms:shift-assignment:*` retired; use user-shift + shift view. */
export const HRMS_SHIFT_ASSIGNMENT_ANY = [
  HRMS.USER_SHIFT_ASSIGN,
  HRMS.SHIFT_VIEW,
] as const;

export const HRMS_WORKFORCE_VIEW_ANY = [
  HRMS.ATTENDANCE_VIEW,
  ...HRMS_ATTENDANCE_SELF_ANY,
  HRMS.LEAVE_APPLY,
  HRMS.LEAVE_TYPE_MANAGE,
  ...HRMS_LEAVE_APPROVE_ANY,
  ...HRMS_SHIFT_ASSIGNMENT_ANY,
] as const;

/** Flatten permission bundles for `hasAnyOperational`. */
export function flattenPermissionCodes(
  codes: readonly string[] | readonly (readonly string[])[],
): string[] {
  const out: string[] = [];
  for (const entry of codes) {
    if (typeof entry === "string") out.push(entry);
    else out.push(...entry);
  }
  return out;
}

export function hasAnyHrmsPage(hasPage: (code: string) => boolean): boolean {
  return HRMS_MODULE_PAGE_PERMISSIONS.some((p) => hasPage(p));
}
