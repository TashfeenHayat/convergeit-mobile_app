import type { ReactNode } from "react";

/** Web body CSS reset — no-op on React Native. */
export function EmbedBodyReset({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
