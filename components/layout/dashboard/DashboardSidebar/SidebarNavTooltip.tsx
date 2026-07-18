import type { ReactNode } from "react";

/** Tooltip chrome is web-only; RN renders children directly. */
export function SidebarNavTooltip({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
