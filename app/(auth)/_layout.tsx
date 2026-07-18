import { Redirect, Stack } from 'expo-router';

import { SplashScreen } from '@/components/ui/SplashScreen';
import { APP_PATHS } from '@/constants/navigation';
import { useAuth } from '@/lib/auth';

const BOOT_BG = '#050508';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen message="Loading…" />;
  }

  if (isAuthenticated) {
    return <Redirect href={APP_PATHS.home} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BOOT_BG },
        animation: 'fade',
      }}
    />
  );
}
