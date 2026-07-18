import { useEffect, useState } from "react";

/** `false` on server + first client paint; `true` after hydration — safe for `localStorage` / `window`. */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
