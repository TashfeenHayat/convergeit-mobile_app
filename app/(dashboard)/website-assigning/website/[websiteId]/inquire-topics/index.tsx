import { useLocalSearchParams } from 'expo-router';

import { WebsiteInquireTopicsWorkspace } from '@/features/website-assignments/components/WebsiteInquireTopicsWorkspace';

export default function Screen() {
  const { websiteId } = useLocalSearchParams<{ websiteId: string }>();
  return <WebsiteInquireTopicsWorkspace websiteId={websiteId ?? ''} />;
}
