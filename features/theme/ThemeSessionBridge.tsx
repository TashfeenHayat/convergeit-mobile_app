import { useEffect, useRef } from "react";

import { useAuth } from "@/lib/auth";
import { useAppearance } from "@/lib/theme/appearance-context";

/** Applies `/auth/me` theme to appearance when the user session loads. */
export function ThemeSessionBridge() {
  const { user, isAuthenticated } = useAuth();
  const { applyAccountTheme } = useAppearance();
  const lastAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      lastAppliedRef.current = null;
      return;
    }
    const bg = user.theme?.backgroundColor?.trim() || null;
    if (!bg || bg === lastAppliedRef.current) return;
    lastAppliedRef.current = bg;
    applyAccountTheme(bg);
  }, [isAuthenticated, user, applyAccountTheme]);

  return null;
}
