import type { ReactNode } from "react";

import { AppProviders } from "@/components/app-root/AppProviders";

/**
 * Mirrors web `AppRootProviders`.
 * Mobile already boots via `AppProviders` in `app/_layout.tsx` — this export stays
 * API-compatible and reuses that same Theme → Query → Auth stack (no double nesting
 * when callers use AppRootProviders instead of AppProviders).
 */
export function AppRootProviders({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
