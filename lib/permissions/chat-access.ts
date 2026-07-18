import { PAGE } from "./permission-constants";
import {
  canAccessRoute,
  type AuthPermissionArrays,
  type PermissionChecker,
} from "./access-helpers";
import {
  CHAT_INBOX_OPERATIONAL_ANY,
  hasChatInboxOperational,
  hasChatInboxOperationalFromChecker,
} from "./chat-inbox-operational";
import { OP } from "./operational-keys";

const CHAT_MONITOR_OPERATIONAL = [
  OP.chat.audit,
  OP.chat.auditPlatform,
  OP.chat.monitorPool,
  OP.chat.monitorDepartment,
  OP.chat.monitorParentCompany,
  OP.chat.monitorInvolvement,
] as const;

/** Org-scope filters on agent inbox — supervisors / monitor / reseller only (not plain agents). */
const CHAT_INBOX_SCOPE_FILTER_OPERATIONAL = [...CHAT_MONITOR_OPERATIONAL] as const;

export type ChatLiveNavItem = { href: string; label: string };

export type AgentInboxEligibilityOptions = {
  /** Pool heads use a plain agent queue for transferred chats — not monitor scope filters. */
  isPoolHead?: boolean;
};

function hasMonitorParentCompanyScope(perms: AuthPermissionArrays): boolean {
  const code = OP.chat.monitorParentCompany;
  if (perms.isPlatformAdmin) {
    return perms.page.includes(code) || perms.operational.includes(code);
  }
  return perms.page.includes(code) || perms.operational.includes(code);
}

function canPermissionCode(code: string, perms: AuthPermissionArrays): boolean {
  if (perms.isPlatformAdmin) return true;
  const c = code.trim();
  if (!c) return false;
  return perms.page.includes(c) || perms.operational.includes(c);
}

/**
 * Personal agent inbox — from `/auth/me` expanded lists only.
 * Excludes platform / parent-company monitors (use Chat Monitor); pool heads keep inbox.
 */
export function canAgentChatFromArrays(
  perms: AuthPermissionArrays,
  options?: AgentInboxEligibilityOptions,
): boolean {
  if (!perms.page.includes(PAGE.CHAT_INBOX)) return false;
  if (!hasChatInboxOperational(perms.operational)) return false;
  if (options?.isPoolHead) return true;
  if (perms.isPlatformAdmin && canMonitorFromArrays(perms)) return false;
  if (hasMonitorParentCompanyScope(perms)) return false;
  return true;
}

export function canMonitorFromArrays(perms: AuthPermissionArrays): boolean {
  if (!perms.page.includes(PAGE.CHAT_MONITOR)) return false;
  return CHAT_MONITOR_OPERATIONAL.some((code) => canPermissionCode(code, perms));
}

export function canQaFromArrays(perms: AuthPermissionArrays): boolean {
  if (!perms.page.includes(PAGE.CHAT_QA)) return false;
  return (
    canPermissionCode(OP.qa.chatReview, perms) ||
    canPermissionCode(OP.qa.chatReviewMessage, perms) ||
    canPermissionCode(OP.qa.chatReviewSession, perms)
  );
}

export function canChatReportsFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    perms.page.includes(PAGE.CHAT_REPORTS) &&
    canPermissionCode(OP.chat.reportView, perms)
  );
}

export function canWidgetSettingsFromArrays(perms: AuthPermissionArrays): boolean {
  if (
    !perms.page.includes(PAGE.CHAT_CLOSE_POLICY) &&
    !perms.page.includes(PAGE.CHAT_CANNED) &&
    !perms.page.includes(PAGE.CHAT_INVOLVEMENT) &&
    !perms.page.includes(PAGE.CHAT_WIDGET)
  ) {
    return false;
  }
  return (
    canPermissionCode(OP.chatWidget.view, perms) ||
    canPermissionCode(OP.chatWidget.update, perms)
  );
}

function hasCopilotUseOperational(perms: AuthPermissionArrays): boolean {
  return (
    canPermissionCode(OP.aiCopilot.use, perms) ||
    canPermissionCode(OP.aiCopilot.useLegacy, perms)
  );
}

/** Inbox AI copilot drawer — requires explicit use permission. */
export function canUseCopilotInboxFromArrays(perms: AuthPermissionArrays): boolean {
  return hasCopilotUseOperational(perms);
}

export function canUseCopilotInbox(
  hasOperational: (permission: string) => boolean,
): boolean {
  return (
    hasOperational(OP.aiCopilot.use) || hasOperational(OP.aiCopilot.useLegacy)
  );
}

/** AI Assistant internal KB training screens. */
export function canAiAssistantTrainingFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    perms.page.includes(PAGE.AI_ASSISTANT) &&
    (canPermissionCode(OP.aiAssistant.trainingView, perms) ||
      canPermissionCode(OP.aiAssistant.trainingManage, perms))
  );
}

/** @deprecated use canAiAssistantTrainingFromArrays or canUseCopilotInboxFromArrays */
export function canAiAssistantFromArrays(perms: AuthPermissionArrays): boolean {
  return canAiAssistantTrainingFromArrays(perms) || canUseCopilotInboxFromArrays(perms);
}

/** AI Copilot setup page (per-website status table). */
export function canCopilotSetupFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    perms.page.includes(PAGE.AI_COPILOT) &&
    (canPermissionCode(OP.aiCopilot.setupView, perms) ||
      canPermissionCode(OP.aiCopilot.setupManage, perms))
  );
}

export function canManageCopilotSetupFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    perms.page.includes(PAGE.AI_COPILOT) &&
    canPermissionCode(OP.aiCopilot.setupManage, perms)
  );
}

export function canManagePlatformAiFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    perms.page.includes(PAGE.AI_PLATFORM) &&
    canPermissionCode(OP.aiPlatform.manage, perms)
  );
}

export function canAiChatbotFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    (perms.page.includes(PAGE.AI_CHATBOT) || perms.page.includes(PAGE.CHAT_WIDGET)) &&
    (canPermissionCode(OP.aiChatbot.trainingView, perms) ||
      canPermissionCode(OP.chatWidget.view, perms) ||
      canPermissionCode(OP.chatWidget.update, perms))
  );
}

/**
 * Agent inbox: `page:chat-inbox` AND a chat bundle / granular inbox op from `/auth/me`.
 */
export function canAccessChatInbox(
  hasOperational: (permission: string) => boolean,
  hasPage?: (pagePermission: string) => boolean,
): boolean {
  if (!hasPage?.(PAGE.CHAT_INBOX)) {
    return false;
  }
  return hasChatInboxOperationalFromChecker(hasOperational);
}

export function canAccessChatInboxFromChecker(perms: PermissionChecker): boolean {
  return canAccessRoute(perms, PAGE.CHAT_INBOX, CHAT_INBOX_OPERATIONAL_ANY);
}

export function canAccessChatMonitor(hasOperational: (permission: string) => boolean): boolean {
  return CHAT_MONITOR_OPERATIONAL.some((p) => hasOperational(p));
}

export function canMonitorRoute(
  hasPage: (page: string) => boolean,
  hasOperational: (permission: string) => boolean,
): boolean {
  return hasPage(PAGE.CHAT_MONITOR) && canAccessChatMonitor(hasOperational);
}

/**
 * Agent inbox: no org filters for plain agents or pool heads (personal queue only).
 */
export function needsChatScopeFilters(
  hasOperational: (permission: string) => boolean,
  canFilterByResellerId = false,
  options?: Pick<AgentInboxEligibilityOptions, "isPoolHead">,
): boolean {
  if (options?.isPoolHead) return false;
  if (canFilterByResellerId) return true;
  return CHAT_INBOX_SCOPE_FILTER_OPERATIONAL.some((p) => hasOperational(p));
}

/** Sidebar / route gate for `/dashboard/chat-operations` — page permission drives nav visibility. */
export function canShowAgentInboxNav(
  perms: AuthPermissionArrays,
  options?: AgentInboxEligibilityOptions,
): boolean {
  if (!perms.page.includes(PAGE.CHAT_INBOX)) return false;
  if (options?.isPoolHead) return true;
  if (perms.isPlatformAdmin && canMonitorFromArrays(perms) && !hasChatInboxOperational(perms.operational)) {
    return false;
  }
  if (hasMonitorParentCompanyScope(perms) && !hasChatInboxOperational(perms.operational)) {
    return false;
  }
  return true;
}

export function buildChatLiveNavItems(
  hasPage: (pagePermission: string) => boolean,
  hasOperational: (permission: string) => boolean,
): ChatLiveNavItem[] {
  const items: ChatLiveNavItem[] = [];
  if (canAccessChatInbox(hasOperational, hasPage)) {
    items.push({ href: "/dashboard/chat-operations", label: "Inbox" });
  }
  if (canMonitorRoute(hasPage, hasOperational)) {
    items.push({ href: "/dashboard/chat-monitor", label: "Monitor" });
  }
  if (hasPage(PAGE.CHAT_QA) && canAccessChatQa(hasOperational)) {
    items.push({ href: "/dashboard/qa/inbox", label: "QA inbox" });
  }
  if (hasPage(PAGE.CHAT_REPORTS) && canViewChatReports(hasOperational)) {
    items.push({ href: "/dashboard/chat-reports", label: "Reports" });
  }
  if (
    (hasPage(PAGE.CHAT_WIDGET) ||
      hasPage(PAGE.CHAT_CLOSE_POLICY) ||
      hasPage(PAGE.CHAT_CANNED) ||
      hasPage(PAGE.CHAT_INVOLVEMENT)) &&
    (hasOperational(OP.chatWidget.view) || hasOperational(OP.chatWidget.update))
  ) {
    items.push({ href: "/dashboard/chat-involvement", label: "Involvement" });
    items.push({ href: "/dashboard/chat-settings/close-policy", label: "Close policy" });
    items.push({ href: "/dashboard/chat-canned", label: "Canned" });
  }
  if (
    (hasPage(PAGE.CHAT_QA_ROSTER) || hasPage(PAGE.CHAT_WIDGET)) &&
    (hasOperational(OP.qa.chatAssign) ||
      hasOperational(OP.chatWidget.view) ||
      hasOperational(OP.chatWidget.update))
  ) {
    items.push({ href: "/dashboard/chat-settings/qa-policy", label: "QA policy" });
    items.push({ href: "/dashboard/qa/roster", label: "QA roster" });
  }
  if (
    hasPage(PAGE.CHAT_WIDGET) &&
    (hasOperational(OP.chatWidget.view) || hasOperational(OP.chatWidget.update))
  ) {
    items.push({ href: "/dashboard/chat-widget", label: "Widget" });
  }
  if (
    hasPage(PAGE.AI_ASSISTANT) &&
    (hasOperational(OP.aiAssistant.trainingView) ||
      hasOperational(OP.aiAssistant.trainingManage))
  ) {
    items.push({ href: "/dashboard/ai-training/assistant", label: "AI Assistant" });
  }
  if (
    hasPage(PAGE.AI_COPILOT) &&
    (hasOperational(OP.aiCopilot.setupView) || hasOperational(OP.aiCopilot.setupManage))
  ) {
    items.push({ href: "/dashboard/ai-training/copilot", label: "AI Copilot" });
  }
  if (
    (hasPage(PAGE.AI_CHATBOT) || hasPage(PAGE.CHAT_WIDGET)) &&
    (hasOperational(OP.aiChatbot.trainingView) ||
      hasOperational(OP.chatWidget.view) ||
      hasOperational(OP.chatWidget.update))
  ) {
    items.push({ href: "/dashboard/ai-training/chatbot", label: "AI Chatbot" });
  }
  return items;
}

export function canWhisper(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.chat.whisper);
}

export function canRequestTakeover(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.chat.takeoverRequest);
}

export function canApproveTakeover(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.chat.takeoverApprove) || hasOperational(OP.chat.takeoverRequest);
}

const CHAT_QA_OPERATIONAL = [
  OP.qa.chatReview,
  OP.qa.chatReviewMessage,
  OP.qa.chatReviewSession,
  OP.qa.chatAssign,
] as const;

export function canViewChatReports(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.chat.reportView);
}

export function canAccessQaTeamReports(
  hasOperational: (permission: string) => boolean,
  isPlatformAdmin = false,
): boolean {
  if (!canViewChatReports(hasOperational)) return false;
  if (isPlatformAdmin) return true;
  return canAccessChatMonitor(hasOperational);
}

export function canAccessChatQa(hasOperational: (permission: string) => boolean): boolean {
  return CHAT_QA_OPERATIONAL.some((p) => hasOperational(p));
}

export function canReviewQaSession(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.qa.chatReviewSession) || hasOperational(OP.qa.chatReview);
}

export function canAnnotateQaMessage(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.qa.chatReviewMessage) || hasOperational(OP.qa.chatReview);
}

export function canAssignQaReview(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.qa.chatAssign);
}

export function canSendGuestLink(hasOperational: (permission: string) => boolean): boolean {
  return (
    hasOperational(OP.chat.guestLinkSend) || hasChatInboxOperationalFromChecker(hasOperational)
  );
}

export function canSupervisorCloseChat(hasOperational: (permission: string) => boolean): boolean {
  return (
    hasOperational(OP.chat.supervisorClose) ||
    hasOperational(OP.chat.monitorPool) ||
    hasOperational(OP.chat.monitorDepartment)
  );
}

export function canUseSupervisorTools(hasOperational: (permission: string) => boolean): boolean {
  return (
    canWhisper(hasOperational) ||
    canRequestTakeover(hasOperational) ||
    canApproveTakeover(hasOperational) ||
    canAccessChatMonitor(hasOperational)
  );
}

export function canPlatformChatAudit(hasOperational: (permission: string) => boolean): boolean {
  return hasOperational(OP.chat.auditPlatform);
}
