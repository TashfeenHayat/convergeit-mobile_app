import { Redirect } from 'expo-router';

import { APP_PATHS, AUTH_PATHS } from '@/constants/navigation';
import { useAuth } from '@/lib/auth';

/**
 * Entry after bootstrap splash. Auth loading is already gated by
 * `BootstrapSplashGate` — this only routes login vs home.
 */
export default function Index() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={APP_PATHS.home} />;
  }

  return <Redirect href={AUTH_PATHS.login} />;
}
