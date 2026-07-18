import { useLocalSearchParams } from 'expo-router';

import { CompanyEditPage } from '@/features/companies';

export default function Screen() {
  const { parentId } = useLocalSearchParams<{ parentId: string }>();
  return <CompanyEditPage parentId={parentId ?? ''} initialSection="services" />;
}
