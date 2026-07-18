import { useLocalSearchParams } from 'expo-router';

import { CompanyResellerDetailPage } from '@/features/companies';

export default function Screen() {
  const { resellerId } = useLocalSearchParams<{ resellerId: string }>();
  return <CompanyResellerDetailPage resellerId={resellerId ?? ''} />;
}
