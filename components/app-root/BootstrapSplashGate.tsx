import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { SplashScreen } from '@/components/ui/SplashScreen';
import { useAuth } from '@/lib/auth';
import { useAppearance } from '@/lib/theme/appearance-context';

/**
 * Keeps the branded splash up until:
 * - stored appearance is loaded
 * - session token is hydrated
 * - (when logged in) `/auth/me` has returned
 *
 * Avoids white / blank intermediate frames on cold start.
 */
export function BootstrapSplashGate({ children }: { children: ReactNode }) {
  const { isLoading: authLoading } = useAuth();
  const { ready: appearanceReady } = useAppearance();

  // Soften bootstrap: never block the whole tree forever if appearance storage hangs.
  const [forceReady, setForceReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setForceReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if ((!appearanceReady && !forceReady) || authLoading) {
    return (
      <SplashScreen
        message={
          !appearanceReady && !forceReady
            ? 'Loading…'
            : 'Preparing your workspace…'
        }
      />
    );
  }

  return <>{children}</>;
}
