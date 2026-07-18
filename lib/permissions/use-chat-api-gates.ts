import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canAgentChatFromArrays,
  canChatReportsFromArrays,
  canMonitorFromArrays,
  canQaFromArrays,
  canUseCopilotInboxFromArrays,
  canWidgetSettingsFromArrays,
} from "./chat-access";

/**
 * Runtime API gates from GET /auth/me expanded lists only.
 * Use `enabled` on hooks: `if (!gates.agentInbox) return` in effects, `enabled: gates.agentInbox` in useQuery.
 */
export function useChatApiGates() {
  const {
    user,
    pagePermissions,
    operationalPermissions,
    isPlatformAdmin,
    rbacEnabled,
    permissionsSyncing,
  } = useAuth();

  const rbacOff = !rbacEnabled;

  const perms = useMemo(
    () => ({
      page: pagePermissions,
      operational: operationalPermissions,
      isPlatformAdmin,
    }),
    [pagePermissions, operationalPermissions, isPlatformAdmin],
  );

  return useMemo(() => {
    const ready = rbacOff || !permissionsSyncing;
    const agentInbox =
      ready &&
      (rbacOff ||
        canAgentChatFromArrays(perms, { isPoolHead: user?.isPoolHead === true }));
    const monitor = ready && (rbacOff || canMonitorFromArrays(perms));
    const qa = ready && (rbacOff || canQaFromArrays(perms));
    const reports = ready && (rbacOff || canChatReportsFromArrays(perms));
    const widgetSettings = ready && (rbacOff || canWidgetSettingsFromArrays(perms));
    const copilotUse =
      ready && (rbacOff || canUseCopilotInboxFromArrays(perms));

    return {
      ready,
      agentInbox,
      monitor,
      qa,
      reports,
      widgetSettings,
      copilotUse,
      perms,
    };
  }, [perms, permissionsSyncing, rbacOff, user?.isPoolHead]);
}
