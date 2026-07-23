import type { DashboardNavItem } from "./dashboard-nav.types";
import {
    COMMERCIAL_PAGE_PERMISSIONS,
    PAGE_PERMISSION_ORDER,
    firstCommercialPageInNavOrder,
    toNavItem,
} from "./dashboard-route-table";
import { OP } from "./operational-keys";
import {
    AI_PAGE_PERMISSIONS,
    DEPARTMENTS_PAGE_PERMISSIONS,
    EMAIL_PAGE_PERMISSIONS,
    HRMS_MODULE_PAGE_PERMISSIONS,
    LIVE_CHAT_PAGE_PERMISSIONS,
    PAGE,
    POOLS_PAGE_PERMISSIONS,
    REPORTS_PAGE_PERMISSIONS,
    SETTINGS_PAGE_PERMISSIONS,
    USERS_PAGE_PERMISSIONS,
    VISITOR_CHANNELS_PAGE_PERMISSIONS,
    WEBSITE_PAGE_PERMISSIONS,
} from "./permission-constants";

const CHAT_MONITOR_OPERATIONAL_ANY = [
  OP.chat.audit,
  OP.chat.auditPlatform,
  OP.chat.monitorPool,
  OP.chat.monitorDepartment,
  OP.chat.monitorParentCompany,
  OP.chat.monitorInvolvement,
  OP.chat.monitorInternalSupervisor,
] as const;

const CHAT_QA_OPERATIONAL_ANY = [
  OP.qa.chatReview,
  OP.qa.chatReviewMessage,
  OP.qa.chatReviewSession,
  OP.qa.chatAssign,
] as const;

function leafNavItem(
  permission: string,
  href: string,
  label: string,
  iconKey: DashboardNavItem["iconKey"],
  extras?: Partial<DashboardNavItem>,
): DashboardNavItem {
  const item = toNavItem(permission as Parameters<typeof toNavItem>[0]);
  return {
    href,
    label,
    section: "activity",
    iconKey,
    permission,
    prefixMatch: true,
    ...(item?.pathExcludes ? { pathExcludes: item.pathExcludes } : {}),
    ...extras,
  };
}

const LIVE_CHAT_GROUP: DashboardNavItem = {
  href: "/dashboard/chat-operations",
  label: "Live chat",
  section: "activity",
  iconKey: "chat",
  permission: null,
  permissionsAny: [...LIVE_CHAT_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(
      PAGE.CHAT_INBOX,
      "/dashboard/chat-operations",
      "Agent inbox",
      "chat",
    ),
    leafNavItem(
      PAGE.CHAT_MONITOR,
      "/dashboard/chat-monitor",
      "Monitor",
      "chat",
      {
        operationalAny: [...CHAT_MONITOR_OPERATIONAL_ANY],
      },
    ),
    leafNavItem(
      PAGE.CHAT_TRANSCRIPTS,
      "/dashboard/chat-transcripts",
      "Chat transcripts",
      "chat",
    ),
    leafNavItem(PAGE.CHAT_QA, "/dashboard/qa/inbox", "QA inbox", "chat", {
      operationalAny: [...CHAT_QA_OPERATIONAL_ANY],
    }),
    leafNavItem(
      PAGE.CHAT_QA_ROSTER,
      "/dashboard/qa/roster",
      "QA roster",
      "chat",
      {
        operationalAny: [OP.qa.chatAssign],
      },
    ),
    leafNavItem(
      PAGE.CHAT_QA_TEAM_REPORTS,
      "/dashboard/qa/team-quality",
      "Team QA reports",
      "chat",
    ),
    leafNavItem(
      PAGE.CHAT_REPORTS,
      "/dashboard/chat-reports",
      "Reports",
      "reports",
      {
        operationalAny: [OP.chat.reportView],
        prefixMatch: true,
      },
    ),
    leafNavItem(
      PAGE.CHAT_WEBSITE_ANALYTICS,
      "/dashboard/website-analytics",
      "Website analytics",
      "reports",
      {
        operationalAny: [OP.chat.reportView],
      },
    ),
    leafNavItem(
      PAGE.CHAT_CLOSE_POLICY,
      "/dashboard/chat-settings",
      "Settings",
      "chatWidget",
    ),
    leafNavItem(
      PAGE.CHAT_CANNED,
      "/dashboard/chat-canned",
      "Canned messages",
      "chatWidget",
    ),
    leafNavItem(
      PAGE.CHAT_INVOLVEMENT,
      "/dashboard/chat-involvement",
      "Involvement",
      "chatWidget",
    ),
    leafNavItem(
      PAGE.CHAT_INTERNAL_SUPERVISORS,
      "/dashboard/chat-internal-supervisors",
      "Internal supervisors",
      "chatWidget",
    ),
  ],
};

const WIDGET_GROUP: DashboardNavItem = {
  href: "/dashboard/chat-widget",
  label: "Widget",
  section: "activity",
  iconKey: "chatWidget",
  permission: null,
  permissionsAny: [...VISITOR_CHANNELS_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(
      PAGE.CHAT_WIDGET,
      "/dashboard/chat-widget",
      "Chat widget",
      "chatWidget",
      {
        pathExcludes: ["/add/text", "/dashboard/text-us"],
      },
    ),
    leafNavItem(
      PAGE.PHONE_NUMBER_SETUP,
      "/dashboard/text-us",
      "Text Us",
      "chatWidget",
      {
        operationalAny: [OP.phoneNumberSetup.view],
        pathIncludes: "/chat-widget/add/text",
        pathExcludes: ["/phone-number-setup"],
      },
    ),
  ],
};

const AI_MANAGEMENT_GROUP: DashboardNavItem = {
  href: "/dashboard/ai-training",
  label: "AI Management",
  section: "activity",
  iconKey: "aiTraining",
  permission: null,
  permissionsAny: [...AI_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(
      PAGE.AI_ASSISTANT,
      "/dashboard/ai-training/assistant",
      "AI Assistant",
      "aiTraining",
      {
        operationalAny: [
          OP.aiAssistant.trainingView,
          OP.aiAssistant.trainingManage,
        ],
      },
    ),
    leafNavItem(
      PAGE.AI_CHATBOT,
      "/dashboard/ai-training/chatbot",
      "AI Chatbot",
      "aiTraining",
      {
        operationalAny: [
          OP.aiChatbot.trainingView,
          OP.aiChatbot.trainingManage,
        ],
      },
    ),
    leafNavItem(
      PAGE.AI_COPILOT,
      "/dashboard/ai-training/copilot",
      "AI Copilot",
      "aiTraining",
      {
        operationalAny: [OP.aiCopilot.setupView, OP.aiCopilot.setupManage],
      },
    ),
    leafNavItem(
      PAGE.AI_PLATFORM,
      "/dashboard/ai-training/platform-keys",
      "AI Configuration",
      "aiTraining",
      {
        operationalAny: [OP.aiPlatform.manage],
      },
    ),
  ],
};

export const ALWAYS_VISIBLE_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    section: "footer",
    iconKey: "settings",
    permission: null,
  },
  {
    href: "/dashboard/settings/profile",
    label: "Profile",
    section: "footer",
    iconKey: "profile",
    permission: null,
  },
  {
    href: "/dashboard/theme",
    label: "Theme",
    section: "footer",
    iconKey: "theme",
    permission: null,
  },
] as const;

const DEPARTMENTS_GROUP: DashboardNavItem = {
  href: "/dashboard/departments",
  label: "Departments",
  section: "activity",
  iconKey: "departments",
  permission: null,
  permissionsAny: [...DEPARTMENTS_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    { ...toNavItem(PAGE.DEPARTMENTS)!, label: "Department list" },
    leafNavItem(
      PAGE.DESIGNATIONS,
      "/dashboard/designations",
      "Designations",
      "designations",
      { prefixMatch: false },
    ),
    leafNavItem(
      PAGE.DEPARTMENT_HEADS,
      "/dashboard/hrms/department-heads",
      "Department heads",
      "departments",
    ),
  ],
};

const POOLS_GROUP: DashboardNavItem = {
  href: "/dashboard/pools",
  label: "Pools",
  section: "activity",
  iconKey: "pools",
  permission: null,
  permissionsAny: [...POOLS_PAGE_PERMISSIONS],
  children: [
    leafNavItem(PAGE.POOL, "/dashboard/pools", "Pool list", "pools", {
      prefixMatch: true,
    }),
    leafNavItem(
      PAGE.POOL_MEMBERS,
      "/dashboard/hrms/pool-members",
      "Pool members",
      "pools",
    ),
    leafNavItem(
      PAGE.POOL_HEADS,
      "/dashboard/hrms/pool-heads",
      "Pool heads",
      "pools",
    ),
  ],
};

const HRMS_GROUP: DashboardNavItem = {
  href: "/dashboard/hrms",
  label: "HRMS",
  section: "activity",
  iconKey: "hrms",
  permission: null,
  permissionsAny: [...HRMS_MODULE_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(
      PAGE.HRMS_ATTENDANCE_SELF,
      "/dashboard/attendance/my-attendance",
      "My attendance",
      "reports",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.HRMS_ATTENDANCE_MARK,
      "/dashboard/attendance/mark-attendance",
      "Mark attendance",
      "reports",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.HRMS_LEAVE_APPLY,
      "/dashboard/leave/apply-leave",
      "Apply leave",
      "leave",
      { prefixMatch: false },
    ),
    leafNavItem(
      PAGE.HRMS_LEAVE_BALANCE,
      "/dashboard/leave/leave-balance",
      "Leave balance",
      "leave",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.HRMS_ATTENDANCE_TEAM,
      "/dashboard/attendance/team-attendance",
      "Attendance",
      "reports",
      {
        prefixMatch: false,
        operationalAny: [OP.hrms.attendance.view],
      },
    ),
    leafNavItem(
      PAGE.HRMS_LEAVE_TYPES,
      "/dashboard/leave/leave-type",
      "Leave type",
      "leave",
      { prefixMatch: false },
    ),
    leafNavItem(
      PAGE.HRMS_LEAVE_APPROVAL,
      "/dashboard/leave/approval-inbox",
      "Approval inbox",
      "leave",
      {
        prefixMatch: false,
        operationalAny: [
          OP.hrms.leave.approvePool,
          OP.hrms.leave.approveDepartment,
          OP.hrms.leave.approveTenant,
        ],
      },
    ),
    { ...toNavItem(PAGE.SHIFTS)!, label: "Shift list", prefixMatch: false },
    leafNavItem(
      PAGE.SHIFTS_DEPARTMENT,
      "/dashboard/shifts/department-shift",
      "Department shift",
      "shifts",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.SHIFTS_POOL,
      "/dashboard/shifts/pool-shift",
      "Pool shift",
      "shifts",
      { prefixMatch: false },
    ),
    leafNavItem(
      PAGE.SHIFTS_USER,
      "/dashboard/shifts/user-shift",
      "User shift",
      "shifts",
      { prefixMatch: false },
    ),
  ],
};

const WEBSITE_GROUP: DashboardNavItem = {
  href: "/dashboard/website-assigning",
  label: "Website",
  section: "activity",
  iconKey: "websiteAssignments",
  permission: null,
  permissionsAny: [...WEBSITE_PAGE_PERMISSIONS],
  children: [
    {
      ...toNavItem(PAGE.WEBSITE_ASSIGNMENTS)!,
      label: "Website assignments",
      prefixMatch: true,
      pathExcludes: [
        "/service-schedules",
        "/service-scheduling",
        "/inquire-topics",
        "/dashboard/websites",
      ],
    },
    leafNavItem(
      PAGE.WEBSITE_DIRECTORY,
      "/dashboard/websites",
      "Website directory",
      "websiteAssignments",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.WEBSITE_SERVICE_SCHEDULING,
      "/dashboard/website-assigning/service-schedules",
      "Service scheduling",
      "websiteAssignments",
      { pathIncludes: "/service-scheduling" },
    ),
    leafNavItem(
      PAGE.WEBSITE_INQUIRE_TOPICS,
      "/dashboard/website-assigning/inquire-topics",
      "Inquire topics",
      "websiteAssignments",
      { pathIncludes: "/inquire-topics" },
    ),
  ],
};

const USERS_GROUP: DashboardNavItem = {
  href: "/dashboard/user-page",
  label: "Users",
  section: "activity",
  iconKey: "users",
  permission: null,
  permissionsAny: [...USERS_PAGE_PERMISSIONS],
  children: [
    { ...toNavItem(PAGE.USERS)!, label: "User list", prefixMatch: false },
    leafNavItem(
      PAGE.USERS_PERMISSIONS,
      "/dashboard/user-page/permissions",
      "User permissions",
      "users",
      {
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.USERS_POC_LIST,
      "/dashboard/user-page/poc-list",
      "POC list",
      "users",
      { prefixMatch: false },
    ),
  ],
};

const COMMERCIAL_ACCOUNT_GROUP: DashboardNavItem = {
  href: "/dashboard/companies",
  label: "Clients & resellers",
  section: "activity",
  iconKey: "clients",
  permission: null,
  permissionsAny: [...COMMERCIAL_PAGE_PERMISSIONS],
  children: [
    {
      href: "/dashboard/companies",
      label: "Companies",
      section: "activity",
      iconKey: "Reseller-Management",
      permission: null,
      permissionsAny: [...COMMERCIAL_PAGE_PERMISSIONS],
      prefixMatch: true,
    },
    {
      href: "/dashboard/services",
      label: "Services",
      section: "activity",
      iconKey: "resellers",
      permission: null,
      permissionsAny: ["page:account-setup"],
      prefixMatch: true,
      internalOnly: true,
    },
    {
      href: "/dashboard/contract",
      label: "New contract",
      section: "activity",
      iconKey: "resellers",
      permission: null,
      permissionsAny: ["page:account-setup"],
      prefixMatch: true,
      internalOnly: true,
    },
  ],
};

const REPORTS_GROUP: DashboardNavItem = {
  href: "/dashboard/reports",
  label: "Reports",
  section: "activity",
  iconKey: "reports",
  permission: null,
  permissionsAny: [...REPORTS_PAGE_PERMISSIONS],
  prefixMatch: true,
  operationalAny: [OP.report.view],
  children: [
    leafNavItem(
      PAGE.REPORTS,
      "/dashboard/reports",
      "Generate reports",
      "reports",
      {
        prefixMatch: false,
        operationalAny: [OP.report.view],
      },
    ),
    leafNavItem(
      PAGE.REPORTS_CONFIGURATION,
      "/dashboard/reports/configuration",
      "Reports configuration",
      "reports",
      {
        operationalAny: [OP.report.view],
      },
    ),
  ],
};

const SETTINGS_GROUP: DashboardNavItem = {
  href: "/dashboard/settings",
  label: "Settings",
  section: "activity",
  iconKey: "settings",
  permission: null,
  permissionsAny: [...SETTINGS_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(PAGE.SETTINGS, "/dashboard/settings", "Overview", "settings", {
      prefixMatch: false,
    }),
    leafNavItem(
      PAGE.SETTINGS_PROFILE,
      "/dashboard/settings/profile",
      "Profile",
      "settings",
      { prefixMatch: false },
    ),
    leafNavItem(
      PAGE.OBSERVABILITY_LOGS,
      "/dashboard/settings/logs",
      "System logs",
      "settings",
      {
        internalOnly: true,
      },
    ),
    leafNavItem(
      PAGE.SETTINGS_SECURITY,
      "/dashboard/security",
      "Security",
      "settings",
    ),
  ],
};

const EMAIL_GROUP: DashboardNavItem = {
  href: "/dashboard/email/setup/reseller",
  label: "Email Configuration",
  section: "activity",
  iconKey: "smtpEmail",
  permission: null,
  permissionsAny: [...EMAIL_PAGE_PERMISSIONS],
  prefixMatch: true,
  children: [
    leafNavItem(
      PAGE.SMTP_EMAIL_RESELLER,
      "/dashboard/email/setup/reseller",
      "Reseller mail",
      "smtpEmail",
    ),
    leafNavItem(
      PAGE.SMTP_EMAIL_PLATFORM,
      "/dashboard/email/setup/platform",
      "Platform mail",
      "smtpEmail",
      {
        internalOnly: true,
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.SMTP_EMAIL_ASSIGNMENT,
      "/dashboard/email/setup/assignment",
      "Use platform mail",
      "smtpEmail",
      {
        internalOnly: true,
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.EMAIL_TEMPLATE_DESIGN,
      "/dashboard/email/design",
      "Email design",
      "smtpEmail",
      {
        pathExcludes: ["/platform", "/assignment", "/editor"],
      },
    ),
    leafNavItem(
      PAGE.EMAIL_TEMPLATE_PLATFORM,
      "/dashboard/email/design/platform",
      "Platform design",
      "smtpEmail",
      {
        internalOnly: true,
        prefixMatch: false,
      },
    ),
    leafNavItem(
      PAGE.EMAIL_TEMPLATE_FORMS,
      "/dashboard/email/forms",
      "Email forms",
      "smtpEmail",
    ),
  ],
};

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] =
  PAGE_PERMISSION_ORDER.flatMap((permission) => {
    if (permission === PAGE.HRMS_OVERVIEW) return [HRMS_GROUP];
    if (permission === PAGE.HRMS_ATTENDANCE_SELF) return [];
    if (permission === PAGE.DEPARTMENTS) return [DEPARTMENTS_GROUP];
    if (permission === PAGE.POOL) return [POOLS_GROUP];
    if (permission === PAGE.WEBSITE_ASSIGNMENTS) return [WEBSITE_GROUP];
    if (permission === PAGE.USERS) return [USERS_GROUP];
    if (permission === PAGE.CHAT_INBOX) return [LIVE_CHAT_GROUP];
    if (permission === PAGE.CHAT_WIDGET) return [WIDGET_GROUP];
    if (permission === PAGE.AI_ASSISTANT) return [AI_MANAGEMENT_GROUP];
    if (COMMERCIAL_PAGE_PERMISSIONS.includes(permission)) {
      const first = firstCommercialPageInNavOrder();
      if (!first || permission !== first) return [];
      return [COMMERCIAL_ACCOUNT_GROUP];
    }
    if (permission === PAGE.SMTP_EMAIL_RESELLER) return [EMAIL_GROUP];
    if (permission === PAGE.SETTINGS) return [SETTINGS_GROUP];
    if (permission === PAGE.REPORTS) return [REPORTS_GROUP];
    const item = toNavItem(permission);
    return item ? [item] : [];
  });
