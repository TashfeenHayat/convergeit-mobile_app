import { useLocalSearchParams } from 'expo-router';
import { ChatMonitorWorkspace } from '@/features/chat-monitor';

export default function Screen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  return <ChatMonitorWorkspace initialConversationId={params.conversationId ?? null} />;
}
