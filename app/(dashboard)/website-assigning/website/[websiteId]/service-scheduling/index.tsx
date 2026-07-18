import { useLocalSearchParams } from 'expo-router';

import { WebsiteServiceSchedulingWorkspace } from '@/features/website-assignments/components/WebsiteServiceSchedulingWorkspace';

export default function Screen() {
  const { websiteId } = useLocalSearchParams<{ websiteId: string }>();
  return <WebsiteServiceSchedulingWorkspace websiteId={websiteId ?? ''} />;
}
