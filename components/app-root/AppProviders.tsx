import type { ReactNode } from 'react';

import { BootstrapSplashGate } from '@/components/app-root/BootstrapSplashGate';
import ThemeRegistry from '@/components/theme-registry/ThemeRegistry';
import { GlassToastProvider } from '@/components/ui/GlassToastProvider';
import { ThemeSessionBridge } from '@/features/theme/ThemeSessionBridge';
import { AuthProvider } from '@/lib/auth';
import { QueryProvider } from '@/lib/hooks';

/**
 * Mirrors web `AppRootProviders`:
 * ThemeRegistry → Query → Auth → splash gate until session ready
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeRegistry>
      <QueryProvider>
        <AuthProvider>
          <GlassToastProvider>
            <ThemeSessionBridge />
            <BootstrapSplashGate>{children}</BootstrapSplashGate>
          </GlassToastProvider>
        </AuthProvider>
      </QueryProvider>
    </ThemeRegistry>
  );
}
