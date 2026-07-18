import { useLocalSearchParams } from 'expo-router';

import { CompanyParentDetailPage } from '@/features/companies';

export default function Screen() {
  const { parentId } = useLocalSearchParams<{ parentId: string }>();
  return <CompanyParentDetailPage parentId={parentId ?? ''} />;
}
