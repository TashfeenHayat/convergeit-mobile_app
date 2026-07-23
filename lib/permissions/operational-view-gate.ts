import { PAGE_PERMISSION_DASHBOARD } from "@/lib/auth/permissions-model";
import { getDashboardPathPageRequirements } from "./dashboard-access";
import { hasAnyOperational } from "./access-helpers";
import { HRMS, HRMS_ATTENDANCE_SELF_ANY, HRMS_LEAVE_APPROVE_ANY, HRMS_SHIFT_ASSIGNMENT_ANY, HRMS_WORKFORCE_VIEW_ANY, ORG, PAGE } from "./permission-constants";
import { CHAT_INBOX_OPERATIONAL_ANY } from "./chat-inbox-operational";
import { OP } from "./operational-keys";

/**
 * Longest-prefix wins. Any one operational string grants “view” for that screen.
 * Org routes use {@link ORG}; workforce HRMS uses granular `page:hrms-*` keys.
 */
const PREFIX_VIEW_RULES: readonly { prefix: string; anyOf: readonly string[] }[] = [
  {
    prefix: "/dashboard/chat-operations",
    anyOf: [...CHAT_INBOX_OPERATIONAL_ANY],
  },
  {
    prefix: "/dashboard/chat-monitor",
    anyOf: [
      OP.chat.audit,
      OP.chat.auditPlatform,
      OP.chat.monitorPool,
      OP.chat.monitorDepartment,
      OP.chat.monitorParentCompany,
    ],
  },
  {
    prefix: "/dashboard/chat-transcripts",
    anyOf: [
      OP.chat.audit,
      OP.chat.auditPlatform,
      OP.chat.monitorPool,
      OP.chat.monitorDepartment,
      OP.chat.monitorParentCompany,
      OP.qa.chatReview,
    ],
  },
  {
    prefix: "/dashboard/qa/roster/assign",
    anyOf: [OP.qa.chatAssign, OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/qa/roster",
    anyOf: [OP.qa.chatAssign, OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/qa/team-quality",
    anyOf: [
      OP.chat.reportView,
      OP.chat.monitorPool,
      OP.chat.monitorDepartment,
      OP.chat.monitorParentCompany,
      OP.chat.audit,
      OP.chat.auditPlatform,
    ],
  },
  {
    prefix: "/dashboard/qa",
    anyOf: [
      OP.qa.chatReview,
      OP.qa.chatReviewMessage,
      OP.qa.chatReviewSession,
      OP.qa.chatAssign,
    ],
  },
  {
    prefix: "/dashboard/chat-qa",
    anyOf: [
      OP.qa.chatReview,
      OP.qa.chatReviewMessage,
      OP.qa.chatReviewSession,
      OP.qa.chatAssign,
    ],
  },
  {
    prefix: "/dashboard/chat-reports",
    anyOf: [OP.chat.reportView],
  },
  {
    prefix: "/dashboard/website-analytics",
    anyOf: [OP.chat.reportView],
  },
  {
    prefix: "/dashboard/chat-settings/close-policy",
    anyOf: [OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/chat-settings/qa-policy",
    anyOf: [OP.qa.chatAssign, OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/chat-settings/qa-roster",
    anyOf: [OP.qa.chatAssign, OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/chat-settings",
    anyOf: [OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/chat-involvement",
    anyOf: [OP.chat.monitorInvolvement, OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/chat-internal-supervisors",
    anyOf: [
      OP.chat.monitorInternalSupervisor,
      OP.chatWidget.view,
      OP.chatWidget.update,
    ],
  },
  {
    prefix: "/dashboard/ai-training/assistant",
    anyOf: [
      OP.aiAssistant.trainingView,
      OP.aiAssistant.trainingManage,
    ],
  },
  {
    prefix: "/dashboard/ai-training/copilot",
    anyOf: [OP.aiCopilot.setupView, OP.aiCopilot.setupManage],
  },
  {
    prefix: "/dashboard/ai-training/platform-keys",
    anyOf: [OP.aiPlatform.manage],
  },
  {
    prefix: "/dashboard/ai-training/chatbot",
    anyOf: [
      OP.aiChatbot.trainingView,
      OP.aiChatbot.trainingManage,
      OP.chatWidget.view,
      OP.chatWidget.update,
    ],
  },
  {
    prefix: "/dashboard/chat-canned",
    anyOf: [OP.chatWidget.view, OP.chatWidget.update],
  },
  {
    prefix: "/dashboard/website-assigning",
    anyOf: [OP.websiteAssignment.view, OP.website.assign],
  },
  {
    prefix: "/dashboard/departments",
    anyOf: [...ORG.DEPT_VIEW, ...ORG.DEPT_MANAGE, ...ORG.ORG_MANAGE, ...ORG.STRUCTURE_VIEW],
  },
  {
    prefix: "/dashboard/designations",
    anyOf: [...ORG.DESIGNATION_VIEW, ...ORG.DESIGNATION_MANAGE, ...ORG.ORG_MANAGE],
  },
  {
    prefix: "/dashboard/pools",
    anyOf: [
      ...ORG.POOL_VIEW,
      ...ORG.POOL_MANAGE,
      ...ORG.ORG_MANAGE,
      ...ORG.POOL_MEMBER_ADD,
      ...ORG.POOL_MEMBER_UPDATE,
      ...ORG.POOL_MEMBER_REMOVE,
    ],
  },
  {
    prefix: "/dashboard/hrms/pool-members",
    anyOf: [
      ...ORG.POOL_VIEW,
      ...ORG.POOL_MANAGE,
      ...ORG.ORG_MANAGE,
      ...ORG.POOL_MEMBER_ADD,
      ...ORG.POOL_MEMBER_UPDATE,
      ...ORG.POOL_MEMBER_REMOVE,
    ],
  },
  {
    prefix: "/dashboard/hrms/pool-heads",
    anyOf: [...ORG.POOL_HEAD_VIEW, ...ORG.POOL_MANAGE, ...ORG.ORG_MANAGE, ...ORG.POOL_VIEW],
  },
  {
    prefix: "/dashboard/hrms/department-heads",
    anyOf: [...ORG.DEPT_VIEW, ...ORG.DEPT_MANAGE, ...ORG.ORG_MANAGE],
  },
  { prefix: "/dashboard/leave/leave-type", anyOf: [HRMS.LEAVE_TYPE_MANAGE, OP.hrms.leave.typeManage] },
  {
    prefix: "/dashboard/leave/approve-leave",
    anyOf: [...HRMS_LEAVE_APPROVE_ANY, OP.hrms.leave.approveDepartment, OP.hrms.leave.approvePool, OP.hrms.leave.approveTenant],
  },
  {
    prefix: "/dashboard/leave/approval-inbox",
    anyOf: [...HRMS_LEAVE_APPROVE_ANY, OP.hrms.leave.approveDepartment, OP.hrms.leave.approvePool, OP.hrms.leave.approveTenant],
  },
  {
    prefix: "/dashboard/leave/apply-leave",
    anyOf: [HRMS.LEAVE_APPLY, OP.hrms.leave.apply],
  },
  {
    prefix: "/dashboard/leave/leave-balance",
    anyOf: [HRMS.LEAVE_APPLY, OP.hrms.leave.apply],
  },
  {
    prefix: "/dashboard/leave",
    anyOf: [
      HRMS.LEAVE_APPLY,
      HRMS.LEAVE_TYPE_MANAGE,
      ...HRMS_LEAVE_APPROVE_ANY,
      OP.hrms.leave.apply,
      OP.hrms.leave.typeManage,
    ],
  },
  {
    prefix: "/dashboard/attendance/mark-attendance",
    anyOf: [...HRMS_ATTENDANCE_SELF_ANY, HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.view],
  },
  { prefix: "/dashboard/attendance/team-attendance", anyOf: [HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.view] },
  {
    prefix: "/dashboard/attendance/my-attendance",
    anyOf: [...HRMS_ATTENDANCE_SELF_ANY, HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.selfView],
  },
  {
    prefix: "/dashboard/attendance",
    anyOf: [...HRMS_ATTENDANCE_SELF_ANY, HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.view],
  },
  {
    prefix: "/dashboard/shifts/user-shift",
    anyOf: [...HRMS_SHIFT_ASSIGNMENT_ANY, OP.hrms.userShift.assign, OP.hrms.shift.view],
  },
  {
    prefix: "/dashboard/shifts/department-shift",
    anyOf: [...HRMS_SHIFT_ASSIGNMENT_ANY, OP.hrms.shift.view],
  },
  { prefix: "/dashboard/shifts/pool-shift", anyOf: [HRMS.SHIFT_VIEW, OP.hrms.shift.view] },
  { prefix: "/dashboard/shifts", anyOf: [...HRMS_SHIFT_ASSIGNMENT_ANY, OP.hrms.shift.view] },
  {
    prefix: "/dashboard/text-us",
    anyOf: [
      OP.phoneNumberSetup.view,
      OP.phoneNumberSetup.create,
      OP.phoneNumberSetup.update,
      OP.phoneNumberSetup.delete,
      OP.chatWidget.view,
      OP.chatWidget.update,
    ],
  },
  {
    prefix: "/dashboard/phone-number-setup",
    anyOf: [
      OP.phoneNumberSetup.view,
      OP.phoneNumberSetup.create,
      OP.phoneNumberSetup.update,
      OP.phoneNumberSetup.delete,
    ],
  },
  {
    prefix: "/dashboard/email/distribution",
    anyOf: [
      OP.distributionSetup.view,
      OP.distributionSetup.create,
      OP.distributionSetup.update,
      OP.distributionSetup.delete,
    ],
  },
  {
    prefix: "/dashboard/feedback",
    anyOf: [OP.agentFeedback.view, OP.agentFeedback.update],
  },
  {
    prefix: "/dashboard/email/feedback",
    anyOf: [OP.agentFeedback.view, OP.agentFeedback.update],
  },
  {
    prefix: "/dashboard/email/design",
    anyOf: [OP.emailTemplate.view, OP.emailTemplate.update, OP.emailTemplate.publish],
  },
  {
    prefix: "/dashboard/email/form",
    anyOf: [OP.emailTemplate.view, OP.smtpEmail.view],
  },
  {
    prefix: "/dashboard/email/connection",
    anyOf: [OP.smtpEmail.view, OP.smtpEmail.update, OP.smtpEmail.test],
  },
  {
    prefix: "/dashboard/settings/logs",
    anyOf: [OP.observability.auditRead, OP.observability.analyticsRead],
  },
  {
    prefix: "/dashboard/email",
    anyOf: [
      OP.smtpEmail.view,
      OP.emailTemplate.view,
      OP.emailTemplate.update,
      OP.emailTemplate.publish,
      OP.distributionSetup.view,
      OP.distributionSetup.create,
      OP.distributionSetup.update,
    ],
  },
].sort((a, b) => b.prefix.length - a.prefix.length);

const PAGE_PERMISSION_TO_VIEW_ANY: Readonly<Record<string, readonly string[]>> = {
  [PAGE.CHAT_INBOX]: [...CHAT_INBOX_OPERATIONAL_ANY],
  [PAGE.CHAT_TRANSCRIPTS]: [
    OP.chat.audit,
    OP.chat.auditPlatform,
    OP.chat.monitorPool,
    OP.chat.monitorDepartment,
    OP.chat.monitorParentCompany,
    OP.qa.chatReview,
  ],
  [PAGE.CHAT_QA_TEAM_REPORTS]: [OP.chat.reportView],
  [PAGE.CHAT_WEBSITE_ANALYTICS]: [OP.chat.reportView],
  [PAGE.CHAT_MONITOR]: [
    OP.chat.audit,
    OP.chat.auditPlatform,
    OP.chat.monitorPool,
    OP.chat.monitorDepartment,
    OP.chat.monitorParentCompany,
    OP.chat.monitorInvolvement,
  ],
  [PAGE.CHAT_QA]: [
    OP.qa.chatReview,
    OP.qa.chatReviewMessage,
    OP.qa.chatReviewSession,
    OP.qa.chatAssign,
  ],
  [PAGE.CHAT_REPORTS]: [OP.chat.reportView],
  [PAGE.CHAT_WIDGET]: [OP.chatWidget.view],
  [PAGE.CHAT_CLOSE_POLICY]: [OP.chatWidget.view, OP.chatWidget.update],
  [PAGE.CHAT_CANNED]: [OP.chatWidget.view, OP.chatWidget.update],
  [PAGE.CHAT_INVOLVEMENT]: [OP.chat.monitorInvolvement, OP.chatWidget.view],
  [PAGE.CHAT_QA_ROSTER]: [OP.qa.chatAssign, OP.chatWidget.view],
  [PAGE.AI_ASSISTANT]: [OP.aiAssistant.trainingView],
  [PAGE.AI_CHATBOT]: [OP.aiChatbot.trainingView, OP.chatWidget.view],
  [PAGE.AI_COPILOT]: [OP.aiCopilot.setupView],
  [PAGE.AI_PLATFORM]: [OP.aiPlatform.manage],
  "page:clients": [OP.company.view, OP.company.list, OP.company.detail, OP.accountSetup.view],
  "page:account-setup": [OP.accountSetup.view, OP.company.view, OP.company.list, OP.company.detail],
  "page:resellers": [OP.accountSetup.view, OP.company.view, OP.company.list, OP.company.detail],
  [PAGE.USERS]: [OP.user.view, OP.company.list, OP.company.view],
  [PAGE.ROLES]: [OP.client.permissions],
  [PAGE.WEBSITE_ASSIGNMENTS]: [
    OP.websiteAssignment.view,
    OP.website.assign,
    OP.company.list,
    OP.company.view,
  ],
  [PAGE.WEBSITE_DIRECTORY]: [OP.company.view, OP.company.list, OP.websiteAssignment.view],
  [PAGE.WEBSITE_SERVICE_SCHEDULING]: [OP.websiteAssignment.view, OP.website.assign],
  [PAGE.WEBSITE_INQUIRE_TOPICS]: [OP.websiteAssignment.view, OP.website.assign],
  [PAGE.USERS_PERMISSIONS]: [OP.user.view, OP.client.permissions],
  [PAGE.USERS_POC_LIST]: [OP.user.view, OP.company.list],
  [PAGE.DEPARTMENT_HEADS]: [...ORG.DEPT_VIEW, ...ORG.DEPT_MANAGE, ...ORG.ORG_MANAGE],
  [PAGE.POOL_MEMBERS]: [
    ...ORG.POOL_VIEW,
    ...ORG.POOL_MANAGE,
    ...ORG.POOL_MEMBER_ADD,
    ...ORG.POOL_MEMBER_UPDATE,
    ...ORG.POOL_MEMBER_REMOVE,
  ],
  [PAGE.POOL_HEADS]: [...ORG.POOL_HEAD_VIEW, ...ORG.POOL_MANAGE, ...ORG.POOL_VIEW],
  [PAGE.HRMS_OVERVIEW]: [...HRMS_WORKFORCE_VIEW_ANY, OP.company.list, OP.company.view],
  [PAGE.HRMS_ATTENDANCE_SELF]: [...HRMS_ATTENDANCE_SELF_ANY, HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.selfView],
  [PAGE.HRMS_ATTENDANCE_TEAM]: [HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.view],
  [PAGE.HRMS_ATTENDANCE_MARK]: [...HRMS_ATTENDANCE_SELF_ANY, HRMS.ATTENDANCE_VIEW, OP.hrms.attendance.view],
  [PAGE.HRMS_LEAVE_TYPES]: [HRMS.LEAVE_TYPE_MANAGE, OP.hrms.leave.typeManage],
  [PAGE.HRMS_LEAVE_APPLY]: [HRMS.LEAVE_APPLY, OP.hrms.leave.apply],
  [PAGE.HRMS_LEAVE_APPROVAL]: [
    ...HRMS_LEAVE_APPROVE_ANY,
    OP.hrms.leave.approveDepartment,
    OP.hrms.leave.approvePool,
    OP.hrms.leave.approveTenant,
  ],
  [PAGE.HRMS_LEAVE_BALANCE]: [HRMS.LEAVE_APPLY, OP.hrms.leave.apply],
  [PAGE.SHIFTS_DEPARTMENT]: [...HRMS_SHIFT_ASSIGNMENT_ANY, OP.hrms.shift.view],
  [PAGE.SHIFTS_POOL]: [HRMS.SHIFT_VIEW, OP.hrms.shift.view],
  [PAGE.SHIFTS_USER]: [...HRMS_SHIFT_ASSIGNMENT_ANY, OP.hrms.userShift.assign, OP.hrms.shift.view],
  [PAGE.REPORTS_CONFIGURATION]: [OP.report.view],
  [PAGE.SETTINGS_PROFILE]: [],
  [PAGE.SETTINGS_SECURITY]: [],
  [PAGE.SMTP_EMAIL_RESELLER]: [OP.smtpEmail.view],
  [PAGE.SMTP_EMAIL_PLATFORM]: [OP.smtpEmail.view],
  [PAGE.SMTP_EMAIL_ASSIGNMENT]: [OP.smtpEmail.view],
  [PAGE.EMAIL_TEMPLATE_DESIGN]: [OP.emailTemplate.view],
  [PAGE.EMAIL_TEMPLATE_PLATFORM]: [OP.emailTemplate.view],
  [PAGE.EMAIL_TEMPLATE_FORMS]: [OP.emailTemplate.view],
  [PAGE.DEPARTMENTS]: [
    ...ORG.DEPT_VIEW,
    ...ORG.DEPT_MANAGE,
    ...ORG.ORG_MANAGE,
    OP.company.list,
    OP.company.view,
  ],
  [PAGE.DESIGNATIONS]: [...ORG.DESIGNATION_VIEW, ...ORG.DESIGNATION_MANAGE, ...ORG.ORG_MANAGE],
  [PAGE.POOL]: [
    ...ORG.POOL_VIEW,
    ...ORG.POOL_MANAGE,
    ...ORG.ORG_MANAGE,
    OP.company.list,
    OP.company.view,
  ],
  [PAGE.SHIFTS]: [HRMS.SHIFT_VIEW, OP.hrms.shift.view, OP.company.list, OP.company.view],
  "page:crm-integration": [OP.crmIntegration.view],
  "page:distribution-setup": [OP.distributionSetup.view],
  "page:phone-number-setup": [OP.phoneNumberSetup.view],
  "page:ip-blocklist": [OP.ipBlocklist.view],
  "page:licenses": [
    OP.license.view,
    OP.license.generate,
    OP.license.admin,
    OP.license.send,
    OP.company.list,
    OP.company.view,
  ],
  "page:reports": [OP.report.view],
  "page:billing": [OP.billing.view],
  "page:email-agent-feedback": [OP.agentFeedback.view],
  "page:social-media": [OP.socialMedia.view],
  "page:settings": [],
  "page:observability:logs": [
    OP.observability.auditRead,
    OP.observability.analyticsRead,
  ],
};

function normalizePathname(pathname: string): string {
  const base = pathname.split("?")[0]?.trim() ?? "";
  if (!base || base === "/") return "/";
  return base.replace(/\/+$/, "") || "/";
}

function prefixRuleAnyOf(path: string): readonly string[] | null {
  for (const rule of PREFIX_VIEW_RULES) {
    if (path === rule.prefix || path.startsWith(`${rule.prefix}/`)) {
      return rule.anyOf;
    }
  }
  return null;
}

function unionViewOpsForPagePermissions(pageReqs: readonly string[]): readonly string[] | null {
  const out = new Set<string>();
  for (const p of pageReqs) {
    if (p === PAGE_PERMISSION_DASHBOARD) continue;
    const list = PAGE_PERMISSION_TO_VIEW_ANY[p];
    if (list?.length) list.forEach((x) => out.add(x));
  }
  return out.size > 0 ? [...out] : null;
}

export function getOperationalViewAnyOfForDashboardPath(pathname: string): readonly string[] | null {
  const path = normalizePathname(pathname);
  if (!path.startsWith("/dashboard")) return null;

  const fromPrefix = prefixRuleAnyOf(path);
  if (fromPrefix?.length) return fromPrefix;

  const pageReqs = getDashboardPathPageRequirements(path);
  if (!pageReqs?.length) return null;

  return unionViewOpsForPagePermissions(pageReqs);
}

export function userSatisfiesOperationalViewForDashboardPath(
  hasOperational: (permission: string) => boolean,
  pathname: string,
): boolean {
  const anyOf = getOperationalViewAnyOfForDashboardPath(pathname);
  if (!anyOf?.length) return true;
  return hasAnyOperational(hasOperational, anyOf);
}
