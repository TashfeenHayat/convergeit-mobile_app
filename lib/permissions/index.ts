/**
 * Mirrored from web — exports only RN-safe permission modules.
 * Gate hooks that need fuller AuthContext parity stay as files on disk;
 * re-enable in this barrel when AuthProvider exposes matching fields.
 */
export {
  DASHBOARD_NAV_ITEMS,
  getAccessibleDashboardHref,
  getDashboardPathPageRequirements,
  getRequiredPagePermission,
  canAccessDashboardPath,
  getFirstAccessibleDashboardPath,
  resolvePostAuthDashboardHref,
  resolveDashboardLandingHref,
  getVisibleDashboardNavItems,
  isNavPathSelected,
} from './dashboard-access';
export type {
  DashboardNavItem,
  DashboardNavSection,
  DashboardSidebarIconKey,
} from './dashboard-nav.types';
export {
  getOperationalViewAnyOfForDashboardPath,
  userSatisfiesOperationalViewForDashboardPath,
} from './operational-view-gate';
export {
  PAGE,
  ORG,
  HRMS,
  HRMS_ATTENDANCE_SELF_ANY,
  HRMS_LEAVE_APPROVE_ANY,
  HRMS_SHIFT_ASSIGNMENT_ANY,
  HRMS_WORKFORCE_VIEW_ANY,
  flattenPermissionCodes,
} from './permission-constants';
export {
  DASHBOARD_WIDGET,
  DASHBOARD_WIDGET_PERMISSION_NAMES,
  isDashboardWidgetPermission,
  type DashboardWidgetPermission,
} from './dashboard-widget-permissions';
export {
  CHAT_INBOX_OPERATIONAL_ANY,
  hasChatInboxOperational,
  hasChatInboxOperationalFromChecker,
} from './chat-inbox-operational';
export {
  hasAnyOperational,
  hasPagePermission,
  canAccessRoute,
  hasPoolPage,
  hasDepartmentsPage,
  canPermissionCode,
  createPermissionCan,
  type PermissionChecker,
  type AuthPermissionArrays,
} from './access-helpers';
export {
  CHAT_CLIENT_CAP_PRESET_NAMES,
  CHAT_CLIENT_CAP_PRESET_LABELS,
} from './chat-client-cap-preset';
export {
  CHAT_BUNDLE_OPTIONS,
  isChatBundleCode,
  isGranularChatPermissionCode,
  pickAssignedChatBundle,
  type ChatBundleCode,
} from './chat-bundles';
export {
  canAccessCompanyScopeFilters,
  canViewWebsiteDirectory,
} from './company-scope-filter-access';
export {
  canAgentChatFromArrays,
  canShowAgentInboxNav,
  type AgentInboxEligibilityOptions,
  canMonitorFromArrays,
  canQaFromArrays,
  canChatReportsFromArrays,
  canWidgetSettingsFromArrays,
  canUseCopilotInboxFromArrays,
  canUseCopilotInbox,
  canAiAssistantTrainingFromArrays,
  canCopilotSetupFromArrays,
  canManageCopilotSetupFromArrays,
  canManagePlatformAiFromArrays,
  canAiAssistantFromArrays,
  canMonitorRoute,
  canAccessChatInbox,
  canAccessChatInboxFromChecker,
  canAccessChatMonitor,
  canAccessChatQa,
  canAnnotateQaMessage,
  canApproveTakeover,
  canAssignQaReview,
  canPlatformChatAudit,
  canRequestTakeover,
  canReviewQaSession,
  canSendGuestLink,
  canSupervisorCloseChat,
  canUseSupervisorTools,
  canViewChatReports,
  canAccessQaTeamReports,
  canWhisper,
  needsChatScopeFilters,
  buildChatLiveNavItems,
  type ChatLiveNavItem,
} from './chat-access';
export {
  OP,
  canManagePoolHeads,
  canRemovePoolHead,
  canManageDepartmentHeads,
  canRemoveDepartmentHead,
  canDepartmentAction,
  canDesignationAction,
  canPoolAction,
  canPoolMemberAdd,
  canPoolMemberList,
  canPoolMemberMove,
  canPoolMemberRemove,
  canShiftAction,
  canOrgManageAny,
  canCompanyAction,
  hasCompaniesModulePage,
  canCompaniesModuleAction,
  canRoleAction,
  canLeaveTypeManage,
  canLeaveTypeView,
  hasAttendanceSelfOperational,
} from './operational-keys';
export { ALWAYS_VISIBLE_NAV_ITEMS } from './dashboard-nav-tree';
