import { useMemo } from "react";
import { hasOperationalPermission, useAuth } from "@/lib/auth";
import { DASHBOARD_WIDGET, type DashboardWidgetPermission } from "./dashboard-widget-permissions";

export type DashboardWidgetFlags = {
  attendanceSelf: boolean;
  hrmsAttendance: boolean;
  hrmsLeave: boolean;
  chatAgent: boolean;
  chatSupervisor: boolean;
  chatQa: boolean;
  chatCompany: boolean;
  platformOverview: boolean;
  revenue: boolean;
  orgSummary: boolean;
  anyOverview: boolean;
  anyHrms: boolean;
  any: boolean;
};

function hasWidget(
  operationalSet: Set<string>,
  rbacEnabled: boolean,
  code: DashboardWidgetPermission,
): boolean {
  if (!rbacEnabled) return true;
  return hasOperationalPermission(operationalSet, code);
}

export function useDashboardWidgets(): DashboardWidgetFlags {
  const { operationalPermissions, rbacEnabled } = useAuth();

  return useMemo(() => {
    const operationalSet = new Set(operationalPermissions);

    const attendanceSelf = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.ATTENDANCE_SELF,
    );
    const hrmsAttendance = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.HRMS_ATTENDANCE,
    );
    const hrmsLeave = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.HRMS_LEAVE,
    );
    const chatAgent = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.CHAT_AGENT,
    );
    const chatSupervisor = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.CHAT_SUPERVISOR,
    );
    const chatQa = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.CHAT_QA,
    );
    const chatCompany = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.CHAT_COMPANY,
    );
    const platformOverview = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.PLATFORM_OVERVIEW,
    );
    const revenue = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.REVENUE,
    );
    const orgSummary = hasWidget(
      operationalSet,
      rbacEnabled,
      DASHBOARD_WIDGET.ORG_SUMMARY,
    );

    const anyOverview =
      chatAgent ||
      chatSupervisor ||
      chatQa ||
      chatCompany ||
      platformOverview ||
      revenue ||
      orgSummary;

    const anyHrms = hrmsAttendance || hrmsLeave;
    const any =
      attendanceSelf || anyOverview || anyHrms || revenue || orgSummary;

    return {
      attendanceSelf,
      hrmsAttendance,
      hrmsLeave,
      chatAgent,
      chatSupervisor,
      chatQa,
      chatCompany,
      platformOverview,
      revenue,
      orgSummary,
      anyOverview,
      anyHrms,
      any,
    };
  }, [operationalPermissions, rbacEnabled]);
}
