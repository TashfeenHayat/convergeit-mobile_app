import type { ReactNode } from "react";

/**
 * RN pass-through — React Native / Expo Router do not use React.Suspense the same way as Next.
 */
export type AppRouteSuspenseProps = {
  children?: ReactNode;
};

export function AppRouteSuspense({ children }: AppRouteSuspenseProps) {
  return <>{children}</>;
}
