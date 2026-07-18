import { useLocalSearchParams } from 'expo-router';

import { UserPermissionsDetailPage } from '@/features/users';

export default function Screen() {
  const params = useLocalSearchParams<{ userId?: string | string[] }>();
  const raw = params.userId;
  const userId = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  return <UserPermissionsDetailPage userId={userId} />;
}
