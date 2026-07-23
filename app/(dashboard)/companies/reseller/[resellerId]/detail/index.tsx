import { useLocalSearchParams } from 'expo-router';

import { CompanyResellerDetailPage } from '@/features/companies';

export default function Screen() {
  const { resellerId, name } = useLocalSearchParams<{
    resellerId: string;
    name?: string;
  }>();
  return (
    <CompanyResellerDetailPage
      resellerId={resellerId ?? ''}
      resellerName={typeof name === 'string' ? name : undefined}
    />
  );
}
