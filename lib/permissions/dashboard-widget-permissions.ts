/**
 * Dashboard home widgets — separate from `page:*` module navigation.
 * Mirrors `Convergit_saas/src/common/constants/dashboard-permissions.ts`.
 */

export const DASHBOARD_WIDGET = {
  ATTENDANCE_SELF: "dashboard:widget:attendance-self",
  HRMS_ATTENDANCE: "dashboard:widget:hrms-attendance",
  HRMS_LEAVE: "dashboard:widget:hrms-leave",
  CHAT_AGENT: "dashboard:widget:chat-agent",
  CHAT_SUPERVISOR: "dashboard:widget:chat-supervisor",
  CHAT_QA: "dashboard:widget:chat-qa",
  CHAT_COMPANY: "dashboard:widget:chat-company",
  PLATFORM_OVERVIEW: "dashboard:widget:platform-overview",
  REVENUE: "dashboard:widget:revenue",
  ORG_SUMMARY: "dashboard:widget:org-summary",
} as const;

export type DashboardWidgetPermission =
  (typeof DASHBOARD_WIDGET)[keyof typeof DASHBOARD_WIDGET];

export const DASHBOARD_WIDGET_PERMISSION_NAMES: readonly DashboardWidgetPermission[] = [
  DASHBOARD_WIDGET.ATTENDANCE_SELF,
  DASHBOARD_WIDGET.HRMS_ATTENDANCE,
  DASHBOARD_WIDGET.HRMS_LEAVE,
  DASHBOARD_WIDGET.CHAT_AGENT,
  DASHBOARD_WIDGET.CHAT_SUPERVISOR,
  DASHBOARD_WIDGET.CHAT_QA,
  DASHBOARD_WIDGET.CHAT_COMPANY,
  DASHBOARD_WIDGET.PLATFORM_OVERVIEW,
  DASHBOARD_WIDGET.REVENUE,
  DASHBOARD_WIDGET.ORG_SUMMARY,
];

const DASHBOARD_WIDGET_SET = new Set<string>(DASHBOARD_WIDGET_PERMISSION_NAMES);

export function isDashboardWidgetPermission(code: string): boolean {
  return DASHBOARD_WIDGET_SET.has(code.trim());
}
