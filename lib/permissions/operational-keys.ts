import { hasAnyOperational } from "./access-helpers";
import { CHAT_INBOX_OPERATIONAL_ANY } from "./chat-inbox-operational";
import {
  HRMS,
  HRMS_ATTENDANCE_SELF_ANY,
  HRMS_SHIFT_ASSIGNMENT_ANY,
  ORG,
} from "./permission-constants";

export const OP = {  accountSetup: {
    create: "account-setup:create",
    delete: "account-setup:delete",
    update: "account-setup:update",
    view: "account-setup:view",
  },
  billing: { view: "billing:view", edit: "billing:edit" },
  observability: {
    auditRead: "observability:audit:read",
    analyticsRead: "observability:analytics:read",
  },
  chat: {
    inboxOperationalAny: CHAT_INBOX_OPERATIONAL_ANY,
    audit: "chat:audit",
    auditPlatform: "chat:audit:platform",
    monitorPool: "chat:monitor:pool",
    monitorDepartment: "chat:monitor:department",
    monitorParentCompany: "chat:monitor:parent-company",
    monitorInvolvement: "chat:monitor:involvement",
    monitorInternalSupervisor: "chat:monitor:internal-supervisor",
    whisper: "chat:whisper",
    takeoverRequest: "chat:takeover:request",
    takeoverApprove: "chat:takeover:approve",
    guestLinkSend: "chat:guest-link:send",
    updateVisitorProfile: "chat:update-visitor-profile",
    supervisorClose: "chat:supervisor:close",
    reportView: "chat:report:view",
  },
  chatWidget: {
    create: "chat-widget:create",
    delete: "chat-widget:delete",
    update: "chat-widget:update",
    view: "chat-widget:view",
  },
  aiAssistant: {
    trainingView: "ai-assistant:training:view",
    trainingManage: "ai-assistant:training:manage",
  },
  aiCopilot: {
    use: "ai-copilot:use",
    useLegacy: "ai-assistant:use",
    setupView: "ai-copilot:setup:view",
    setupManage: "ai-copilot:setup:manage",
  },
  aiChatbot: {
    trainingView: "ai-chatbot:training:view",
    trainingManage: "ai-chatbot:training:manage",
  },
  aiPlatform: {
    manage: "ai-platform:manage",
  },
  client: { permissions: "client:permissions" },
  company: {
    create: "company:create",
    delete: "company:delete",
    detail: "company:detail",
    list: "company:list",
    manage: "company:manage",
    update: "company:update",
    view: "company:view",
  },
  crmIntegration: {
    create: "crm-integration:create",
    delete: "crm-integration:delete",
    update: "crm-integration:update",
    view: "crm-integration:view",
  },
  distributionSetup: {
    create: "distribution-setup:create",
    delete: "distribution-setup:delete",
    update: "distribution-setup:update",
    view: "distribution-setup:view",
  },
  phoneNumberSetup: {
    create: "phone-number-setup:create",
    delete: "phone-number-setup:delete",
    update: "phone-number-setup:update",
    view: "phone-number-setup:view",
  },
  hrms: {
    attendance: {
      checkIn: "hrms:attendance:checkin",
      checkOut: "hrms:attendance:checkout",
      breakIn: "hrms:attendance:breakin",
      breakOut: "hrms:attendance:breakout",
      meetingIn: "hrms:attendance:meetingin",
      meetingOut: "hrms:attendance:meetingout",
      selfView: "hrms:attendance:self:view",
      view: "hrms:attendance:view",
    },
    department: {
      create: "hrms:department:create",
      delete: "hrms:department:delete",
      update: "hrms:department:update",
      view: "hrms:department:view",
    },
    departmentHead: {
      create: "hrms:department-head:create",
      delete: "hrms:department-head:delete",
      update: "hrms:department-head:update",
      view: "hrms:department-head:view",
    },
    designation: {
      create: "hrms:designation:create",
      delete: "hrms:designation:delete",
      update: "hrms:designation:update",
      view: "hrms:designation:view",
    },
    leave: {
      apply: "hrms:leave:apply",
      approveDepartment: "hrms:leave:approve:department",
      approvePool: "hrms:leave:approve:pool",
      approveTenant: "hrms:leave:approve:tenant",
      typeManage: "hrms:leave:type:manage",
    },
    pool: {
      create: "hrms:pool:create",
      delete: "hrms:pool:delete",
      memberAdd: "hrms:pool:member:add",
      memberRemove: "hrms:pool:member:remove",
      memberUpdate: "hrms:pool:member:update",
      update: "hrms:pool:update",
      view: "hrms:pool:view",
    },
    poolHead: {
      create: "hrms:pool-head:create",
      delete: "hrms:pool-head:delete",
      update: "hrms:pool-head:update",
      view: "hrms:pool-head:view",
    },
    shift: {
      create: "hrms:shift:create",
      delete: "hrms:shift:delete",
      update: "hrms:shift:update",
      view: "hrms:shift:view",
    },
    userShift: { assign: "hrms:user-shift:assign" },
  },
  ipBlocklist: {
    create: "ip-blocklist:create",
    delete: "ip-blocklist:delete",
    update: "ip-blocklist:update",
    view: "ip-blocklist:view",
  },
  license: {
    admin: "license:admin",
    generate: "license:generate",
    send: "license:send",
    view: "license:view",
  },
  qa: {
    chatReview: "qa:chat:review",
    chatReviewMessage: "qa:chat:review:message",
    chatReviewSession: "qa:chat:review:session",
    chatAssign: "qa:chat:assign",
  },
  report: { view: "report:view" },
  smtpEmail: {
    create: "smtp-email:create",
    delete: "smtp-email:delete",
    test: "smtp-email:test",
    update: "smtp-email:update",
    view: "smtp-email:view",
  },
  emailTemplate: {
    publish: "email-template:publish",
    update: "email-template:update",
    view: "email-template:view",
  },
  agentFeedback: {
    update: "email-agent-feedback:update",
    view: "email-agent-feedback:view",
  },
  socialMedia: {
    create: "social-media:create",
    delete: "social-media:delete",
    update: "social-media:update",
    view: "social-media:view",
  },
  user: {
    assign: "user:assign",
    create: "user:create",
    delete: "user:delete",
    loginAs: "user:login-as",
    update: "user:update",
    view: "user:view",
  },
  website: { assign: "website:assign" },
  websiteAssignment: {
    create: "website-assignment:create",
    delete: "website-assignment:delete",
    update: "website-assignment:update",
    view: "website-assignment:view",
  },
} as const;

export function canManagePoolHeads(hasOperational: (p: string) => boolean): boolean {
  return (
    hasOperational(OP.hrms.poolHead.create) ||
    hasOperational(OP.hrms.poolHead.update) ||
    hasOperational(OP.hrms.userShift.assign)
  );
}

export function canRemovePoolHead(hasOperational: (p: string) => boolean): boolean {
  return hasOperational(OP.hrms.poolHead.delete);
}

export function canManageDepartmentHeads(hasOperational: (p: string) => boolean): boolean {
  return (
    hasOperational(OP.hrms.departmentHead.create) ||
    hasOperational(OP.hrms.departmentHead.update) ||
    hasOperational(OP.hrms.userShift.assign)
  );
}

export function canRemoveDepartmentHead(hasOperational: (p: string) => boolean): boolean {
  return hasOperational(OP.hrms.departmentHead.delete);
}

type H = (permission: string) => boolean;

function canOrgDepartmentAction(h: H, op: "create" | "update" | "delete" | "view"): boolean {
  if (hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.DEPT_MANAGE])) return true;
  if (op === "create") return hasAnyOperational(h, [ORG.DEPT_MANAGE]);
  if (op === "update") return hasAnyOperational(h, [ORG.DEPT_MANAGE]) || h(OP.hrms.department.update);
  if (op === "delete") return hasAnyOperational(h, [ORG.DEPT_MANAGE]) || h(OP.hrms.department.delete);
  return hasAnyOperational(h, [ORG.DEPT_VIEW, ORG.DEPT_MANAGE, ORG.ORG_MANAGE]) || h(OP.hrms.department.view);
}

export const canDepartmentAction = canOrgDepartmentAction;

function canOrgDesignationAction(h: H, op: "create" | "update" | "delete" | "view"): boolean {
  if (hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.DESIGNATION_MANAGE])) return true;
  if (op === "create") return hasAnyOperational(h, [ORG.DESIGNATION_MANAGE]) || h(OP.hrms.designation.create);
  if (op === "update") return hasAnyOperational(h, [ORG.DESIGNATION_MANAGE]) || h(OP.hrms.designation.update);
  if (op === "delete") return hasAnyOperational(h, [ORG.DESIGNATION_MANAGE]) || h(OP.hrms.designation.delete);
  return (
    hasAnyOperational(h, [ORG.DESIGNATION_VIEW, ORG.DESIGNATION_MANAGE, ORG.ORG_MANAGE]) ||
    h(OP.hrms.designation.view)
  );
}

export const canDesignationAction = canOrgDesignationAction;

function canOrgPoolAction(h: H, op: "create" | "update" | "delete" | "view"): boolean {
  if (hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.POOL_MANAGE])) return true;
  if (op === "create") return hasAnyOperational(h, [ORG.POOL_MANAGE]) || h(OP.hrms.pool.create);
  if (op === "update") return hasAnyOperational(h, [ORG.POOL_MANAGE]) || h(OP.hrms.pool.update);
  if (op === "delete") return hasAnyOperational(h, [ORG.POOL_MANAGE]) || h(OP.hrms.pool.delete);
  return hasAnyOperational(h, [ORG.POOL_VIEW, ORG.POOL_MANAGE, ORG.ORG_MANAGE]) || h(OP.hrms.pool.view);
}

export const canPoolAction = canOrgPoolAction;

export function canPoolMemberList(h: H): boolean {
  return (
    hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.POOL_MANAGE, ORG.POOL_VIEW]) || h(OP.hrms.pool.view)
  );
}

export function canPoolMemberAdd(h: H): boolean {
  return (
    hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.POOL_MANAGE, ORG.POOL_MEMBER_ADD]) ||
    h(OP.hrms.pool.memberAdd)
  );
}

export function canPoolMemberMove(h: H): boolean {
  return (
    hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.POOL_MANAGE, ORG.POOL_MEMBER_UPDATE]) ||
    h(OP.hrms.pool.memberUpdate)
  );
}

export function canPoolMemberRemove(h: H): boolean {
  return (
    hasAnyOperational(h, [ORG.ORG_MANAGE, ORG.POOL_MANAGE, ORG.POOL_MEMBER_REMOVE]) ||
    h(OP.hrms.pool.memberRemove)
  );
}

export function canShiftAction(h: H, op: "create" | "update" | "delete" | "view"): boolean {
  if (op === "create") return h(HRMS.SHIFT_CREATE) || h(OP.hrms.shift.create);
  if (op === "update") return h(HRMS.SHIFT_UPDATE) || h(OP.hrms.shift.update);
  if (op === "delete") return h(HRMS.SHIFT_DELETE) || h(OP.hrms.shift.delete);
  return h(HRMS.SHIFT_VIEW) || h(OP.hrms.shift.view);
}

export function canOrgManageAny(h: H): boolean {
  return hasAnyOperational(h, [ORG.ORG_MANAGE]);
}

export function canCompanyAction(h: H, op: "create" | "update" | "detail" | "list" | "view"): boolean {
  if (h(OP.company.manage)) return true;
  if (op === "create") return h(OP.company.create);
  if (op === "update") return h(OP.company.update);
  if (op === "detail") return h(OP.company.detail) || h(OP.company.view);
  if (op === "list") return h(OP.company.list) || h(OP.company.view);
  return h(OP.company.view);
}

const COMPANIES_MODULE_PAGE_KEYS = [
  "page:clients",
  "page:account-setup",
  "page:resellers",
] as const;

export function hasCompaniesModulePage(hasPage: (pageKey: string) => boolean): boolean {
  return COMPANIES_MODULE_PAGE_KEYS.some((p) => hasPage(p));
}

export function canCompaniesModuleAction(
  hasPage: (pageKey: string) => boolean,
  hasOperational: (permission: string) => boolean,
  op: "create" | "update" | "detail" | "list" | "view",
): boolean {
  return hasCompaniesModulePage(hasPage) && canCompanyAction(hasOperational, op);
}

export function canRoleAction(h: H): boolean {
  return h(OP.client.permissions);
}

export function canLeaveTypeManage(h: H): boolean {
  return h(OP.hrms.leave.typeManage);
}

export function canLeaveTypeView(h: H): boolean {
  return h(OP.hrms.leave.typeManage) || h(OP.hrms.leave.apply);
}

export function hasAttendanceSelfOperational(h: H): boolean {
  return HRMS_ATTENDANCE_SELF_ANY.some((code) => h(code));
}
