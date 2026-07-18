/**
 * Dashboard home widget order — mirrors backend `dashboard-widget-order.ts`.
 */

import {
  DASHBOARD_WIDGET,
  DASHBOARD_WIDGET_PERMISSION_NAMES,
  type DashboardWidgetPermission,
} from "./dashboard-widget-permissions";
import type { DashboardWidgetFlags } from "./use-dashboard-widgets";

export const DEFAULT_DASHBOARD_WIDGET_ORDER: readonly DashboardWidgetPermission[] = [
  DASHBOARD_WIDGET.ATTENDANCE_SELF,
  DASHBOARD_WIDGET.PLATFORM_OVERVIEW,
  DASHBOARD_WIDGET.REVENUE,
  DASHBOARD_WIDGET.ORG_SUMMARY,
  DASHBOARD_WIDGET.CHAT_COMPANY,
  DASHBOARD_WIDGET.CHAT_SUPERVISOR,
  DASHBOARD_WIDGET.CHAT_AGENT,
  DASHBOARD_WIDGET.CHAT_QA,
  DASHBOARD_WIDGET.HRMS_ATTENDANCE,
  DASHBOARD_WIDGET.HRMS_LEAVE,
];

const WIDGET_SET = new Set<string>(DASHBOARD_WIDGET_PERMISSION_NAMES);

export const DASHBOARD_WIDGET_LABELS: Record<DashboardWidgetPermission, string> = {
  [DASHBOARD_WIDGET.ATTENDANCE_SELF]: "My attendance (check-in / cards)",
  [DASHBOARD_WIDGET.HRMS_ATTENDANCE]: "Team attendance (HRMS)",
  [DASHBOARD_WIDGET.HRMS_LEAVE]: "Pending leave approvals (HRMS)",
  [DASHBOARD_WIDGET.CHAT_AGENT]: "Agent chat overview",
  [DASHBOARD_WIDGET.CHAT_SUPERVISOR]: "Supervisor live monitor",
  [DASHBOARD_WIDGET.CHAT_QA]: "QA review queue",
  [DASHBOARD_WIDGET.CHAT_COMPANY]: "Company chat analytics",
  [DASHBOARD_WIDGET.PLATFORM_OVERVIEW]: "Platform metrics & activity",
  [DASHBOARD_WIDGET.REVENUE]: "Revenue graph & billing",
  [DASHBOARD_WIDGET.ORG_SUMMARY]: "Companies & websites summary",
};

/** Short section titles for the home dashboard layout. */
export const DASHBOARD_WIDGET_SECTION_TITLES: Record<DashboardWidgetPermission, string> = {
  [DASHBOARD_WIDGET.ATTENDANCE_SELF]: "My day",
  [DASHBOARD_WIDGET.HRMS_ATTENDANCE]: "Team attendance",
  [DASHBOARD_WIDGET.HRMS_LEAVE]: "Leave approvals",
  [DASHBOARD_WIDGET.CHAT_AGENT]: "Agent performance",
  [DASHBOARD_WIDGET.CHAT_SUPERVISOR]: "Live supervision",
  [DASHBOARD_WIDGET.CHAT_QA]: "QA queue",
  [DASHBOARD_WIDGET.CHAT_COMPANY]: "Company analytics",
  [DASHBOARD_WIDGET.PLATFORM_OVERVIEW]: "Platform overview",
  [DASHBOARD_WIDGET.REVENUE]: "Revenue",
  [DASHBOARD_WIDGET.ORG_SUMMARY]: "Organizations",
};

export function normalizeDashboardWidgetOrder(raw: unknown): DashboardWidgetPermission[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: DashboardWidgetPermission[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const code = item.trim();
    if (!WIDGET_SET.has(code) || seen.has(code)) continue;
    seen.add(code);
    result.push(code as DashboardWidgetPermission);
  }
  return result;
}

/** When a role has no saved order, derive layout from granted widget permissions. */
export function inferDashboardWidgetOrderFromPermissionNames(
  permissionNames: readonly string[],
): DashboardWidgetPermission[] {
  const granted = new Set(
    permissionNames
      .map((name) => name.trim())
      .filter((name) => WIDGET_SET.has(name)),
  );
  if (granted.size === 0) return [];

  return DEFAULT_DASHBOARD_WIDGET_ORDER.filter((code) => granted.has(code));
}

export function extractDashboardWidgetOrderFromMePayload(payload: unknown): DashboardWidgetPermission[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const user =
    data.user && typeof data.user === "object" && !Array.isArray(data.user)
      ? (data.user as Record<string, unknown>)
      : null;
  if (!user) return [];
  const role =
    user.role && typeof user.role === "object" && !Array.isArray(user.role)
      ? (user.role as Record<string, unknown>)
      : null;
  if (!role) return [];
  return normalizeDashboardWidgetOrder(
    role.dashboardWidgetOrder ?? role.dashboard_widget_order,
  );
}

/** Widget codes that should render for the current user (permission flags + attendance ops). */
export function collectEnabledDashboardWidgetCodes(
  widgets: DashboardWidgetFlags,
  options?: { includeAttendanceByOps?: boolean },
): Set<DashboardWidgetPermission> {
  const enabled = new Set<DashboardWidgetPermission>();
  if (widgets.attendanceSelf || options?.includeAttendanceByOps) {
    enabled.add(DASHBOARD_WIDGET.ATTENDANCE_SELF);
  }
  if (widgets.hrmsAttendance) enabled.add(DASHBOARD_WIDGET.HRMS_ATTENDANCE);
  if (widgets.hrmsLeave) enabled.add(DASHBOARD_WIDGET.HRMS_LEAVE);
  if (widgets.chatAgent) enabled.add(DASHBOARD_WIDGET.CHAT_AGENT);
  if (widgets.chatSupervisor) enabled.add(DASHBOARD_WIDGET.CHAT_SUPERVISOR);
  if (widgets.chatQa) enabled.add(DASHBOARD_WIDGET.CHAT_QA);
  if (widgets.chatCompany) enabled.add(DASHBOARD_WIDGET.CHAT_COMPANY);
  if (widgets.platformOverview) enabled.add(DASHBOARD_WIDGET.PLATFORM_OVERVIEW);
  if (widgets.revenue) enabled.add(DASHBOARD_WIDGET.REVENUE);
  if (widgets.orgSummary) enabled.add(DASHBOARD_WIDGET.ORG_SUMMARY);
  return enabled;
}

/** Merge role order with enabled widgets; append missing widgets using default order. */
export function resolveOrderedDashboardWidgets(
  roleOrder: readonly string[] | null | undefined,
  enabled: Set<DashboardWidgetPermission>,
): DashboardWidgetPermission[] {
  const base =
    roleOrder && roleOrder.length > 0
      ? normalizeDashboardWidgetOrder(roleOrder)
      : [...DEFAULT_DASHBOARD_WIDGET_ORDER];

  const result: DashboardWidgetPermission[] = [];
  const seen = new Set<DashboardWidgetPermission>();

  for (const code of base) {
    if (enabled.has(code) && !seen.has(code)) {
      result.push(code);
      seen.add(code);
    }
  }

  for (const code of DEFAULT_DASHBOARD_WIDGET_ORDER) {
    if (enabled.has(code) && !seen.has(code)) {
      result.push(code);
      seen.add(code);
    }
  }

  return result;
}

/** Keep editor order in sync when widgets are checked/unchecked in the role modal. */
export function mergeDashboardWidgetOrderForSelection(
  currentOrder: readonly string[],
  selectedCodes: Iterable<string>,
): DashboardWidgetPermission[] {
  const selected = new Set(
    [...selectedCodes].filter((code): code is DashboardWidgetPermission =>
      WIDGET_SET.has(code),
    ),
  );
  const result: DashboardWidgetPermission[] = [];
  const seen = new Set<DashboardWidgetPermission>();

  for (const code of normalizeDashboardWidgetOrder(currentOrder)) {
    if (selected.has(code) && !seen.has(code)) {
      result.push(code);
      seen.add(code);
    }
  }

  for (const code of DEFAULT_DASHBOARD_WIDGET_ORDER) {
    if (selected.has(code) && !seen.has(code)) {
      result.push(code);
      seen.add(code);
    }
  }

  for (const code of selected) {
    if (!seen.has(code)) {
      result.push(code);
      seen.add(code);
    }
  }

  return result;
}

export function moveDashboardWidgetOrderItem(
  order: readonly string[],
  code: string,
  direction: "up" | "down",
): DashboardWidgetPermission[] {
  const list = normalizeDashboardWidgetOrder(order);
  const index = list.indexOf(code as DashboardWidgetPermission);
  if (index < 0) return list;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next;
}

export function appendDashboardWidgetToOrder(
  order: readonly string[],
  code: string,
): DashboardWidgetPermission[] {
  if (!WIDGET_SET.has(code)) return normalizeDashboardWidgetOrder(order);
  const widget = code as DashboardWidgetPermission;
  const list = normalizeDashboardWidgetOrder(order);
  if (list.includes(widget)) return list;
  return [...list, widget];
}

export function removeDashboardWidgetFromOrder(
  order: readonly string[],
  code: string,
): DashboardWidgetPermission[] {
  return normalizeDashboardWidgetOrder(order).filter((item) => item !== code);
}
