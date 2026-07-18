import type { ReactNode } from "react";

import { PermissionDeniedPanel } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { userSatisfiesOperationalViewForDashboardPath } from "@/lib/permissions";

export type OperationalViewGateProps = {
  pathname: string;
  children: ReactNode;
};

/**
 * When RBAC is on, requires at least one operational “view” permission for the path.
 */
export function OperationalViewGate({ pathname, children }: OperationalViewGateProps) {
  const { rbacEnabled, permissionsSyncing, hasOperational, isPlatformAdmin } = useAuth();

  if (!rbacEnabled || permissionsSyncing || isPlatformAdmin) {
    return <>{children}</>;
  }

  if (userSatisfiesOperationalViewForDashboardPath(hasOperational, pathname)) {
    return <>{children}</>;
  }

  const isAgentInbox =
    pathname === "/dashboard/chat-operations" || pathname.startsWith("/dashboard/chat-operations/");

  return (
    <PermissionDeniedPanel
      description={
        isAgentInbox
          ? "Agent inbox requires page:chat-inbox and a chat bundle (e.g. chat:bundle:agent) from /auth/me. Assign the bundle on the role, then sign out and back in."
          : undefined
      }
    />
  );
}
