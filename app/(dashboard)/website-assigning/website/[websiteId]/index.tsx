import { useLocalSearchParams } from 'expo-router';

import { WebsiteAssignmentDetailPage } from '@/features/website-assignments/pages/WebsiteAssignmentDetailPage';

export default function Screen() {
  const { websiteId } = useLocalSearchParams<{ websiteId?: string | string[] }>();
  const raw = websiteId;
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  return <WebsiteAssignmentDetailPage websiteId={id} />;
}
