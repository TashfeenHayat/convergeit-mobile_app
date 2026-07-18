import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { useWebsiteAssignmentGates } from "@/lib/permissions/use-website-assignment-gates";

/** Service scheduling lives under website-assigning; API uses chat-widget permissions. */
export function useServiceSchedulingGates() {
  const assignmentGates = useWebsiteAssignmentGates();
  const { hasOperational, permissionsSyncing, rbacEnabled } = useAuth();
  const rbacOff = !rbacEnabled;

  return useMemo(() => {
    const ready = assignmentGates.ready && (rbacOff || !permissionsSyncing);
    const canViewApi =
      ready &&
      (rbacOff ||
        hasOperational(OP.chatWidget.view) ||
        hasOperational(OP.chatWidget.update));
    const canEditApi =
      ready && (rbacOff || hasOperational(OP.chatWidget.update));
    return {
      ready,
      pageView: assignmentGates.view,
      pageAssign: assignmentGates.assign,
      canViewApi,
      canEditApi,
    };
  }, [
    assignmentGates.ready,
    assignmentGates.view,
    assignmentGates.assign,
    hasOperational,
    permissionsSyncing,
    rbacOff,
  ]);
}
