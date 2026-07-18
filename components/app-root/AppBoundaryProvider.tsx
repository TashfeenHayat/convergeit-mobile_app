import type { ReactNode } from "react";

/**
 * RN pass-through for web AppBoundaryProvider (modal auth/session boundaries).
 * Live boundary UI lives in `@/components/ui/AppBoundaryModal` when wired.
 */
export type notifySessionExpired = Record<string, unknown>;

export type AppBoundaryProviderProps = {
  children?: ReactNode;
};

export function AppBoundaryProvider({ children }: AppBoundaryProviderProps) {
  return <>{children}</>;
}
