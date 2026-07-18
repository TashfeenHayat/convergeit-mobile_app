import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  readVisitedModuleHrefs,
  recordDashboardModuleVisit,
} from "@/lib/dashboard/dashboard-module-visits";

export function useDashboardModuleVisits() {
  const { user } = useAuth();
  const userId = user?.id?.trim() ?? "";

  const [visited, setVisited] = useState<Set<string>>(() => readVisitedModuleHrefs(userId));

  useEffect(() => {
    setVisited(readVisitedModuleHrefs(userId));
  }, [userId]);

  const markVisited = useCallback(
    (href: string) => {
      if (!userId) return;
      const changed = recordDashboardModuleVisit(userId, href);
      if (changed) {
        setVisited(readVisitedModuleHrefs(userId));
      }
    },
    [userId],
  );

  const isVisited = useCallback((href: string) => visited.has(href), [visited]);

  return useMemo(
    () => ({
      visited,
      markVisited,
      isVisited,
    }),
    [visited, markVisited, isVisited],
  );
}
