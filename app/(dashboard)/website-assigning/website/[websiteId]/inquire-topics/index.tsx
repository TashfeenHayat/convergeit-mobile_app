import { useLocalSearchParams } from 'expo-router';

import { WebsiteInquireTopicsWorkspace } from '@/features/website-assignments/components/WebsiteInquireTopicsWorkspace';

export default function Screen() {
  const { websiteId } = useLocalSearchParams<{ websiteId?: string | string[] }>();
  const raw = websiteId;
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  return <WebsiteInquireTopicsWorkspace websiteId={id} />;
}
