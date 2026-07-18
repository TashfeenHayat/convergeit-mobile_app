import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import {
  canAssignWebsiteFromArrays,
  canViewWebsiteAssignmentsFromArrays,
} from "./website-assignment-access";

export function useWebsiteAssignmentGates() {
  const {
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
    const view = ready && (rbacOff || canViewWebsiteAssignmentsFromArrays(perms));
    const assign = ready && (rbacOff || canAssignWebsiteFromArrays(perms));
    return { ready, view, assign, perms };
  }, [perms, permissionsSyncing, rbacOff]);
}
