import { useMemo } from "react";
import { useMeQuery } from "@/lib/hooks/query/auth/hooks";
import { extractResellerIdFromMePayload } from "./extract-reseller-id";
import { resolveSessionResellerId, sessionCanFilterByResellerId } from "./session-scope";
import { useAuth } from "./AuthContext";

/** Shared list-scope rules for companies + website-assignments pickers. */
export function useResellerListScope() {
  const { user, isPlatformAdmin } = useAuth();
  const canFilterByResellerId = sessionCanFilterByResellerId(isPlatformAdmin);

  const meQuery = useMeQuery({
    enabled: !canFilterByResellerId && !user?.resellerId?.trim(),
  });
  const meResellerId = useMemo(
    () => (meQuery.data ? extractResellerIdFromMePayload(meQuery.data) ?? null : null),
    [meQuery.data],
  );

  const sessionResellerId = resolveSessionResellerId(user?.resellerId, meResellerId);

  return {
    canFilterByResellerId,
    sessionResellerId,
    isResellerScopeResolving:
      !canFilterByResellerId && !sessionResellerId && meQuery.isLoading,
  };
}
