import { Redirect, useLocalSearchParams, type Href } from 'expo-router';

/** Legacy route — web treats this segment as websiteId. */
export default function Screen() {
  const { userId } = useLocalSearchParams<{ userId?: string | string[] }>();
  const raw = userId;
  const id = Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '');
  if (!id.trim()) return <Redirect href="/website-assigning" />;
  return <Redirect href={`/website-assigning/website/${encodeURIComponent(id)}` as Href} />;
}
