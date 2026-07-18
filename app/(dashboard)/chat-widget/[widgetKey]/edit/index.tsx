import { useLocalSearchParams } from 'expo-router';
import { ChatWidgetDetailClient } from '@/features/chat-widget';

export default function Screen() {
  const params = useLocalSearchParams<{ widgetKey?: string }>();
  const widgetKey = String(params.widgetKey ?? '').trim();
  if (!widgetKey) return null;
  return <ChatWidgetDetailClient widgetKey={widgetKey} variant="manage" />;
}
