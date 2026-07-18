import { useLocalSearchParams } from 'expo-router';
import { ChatQaWorkspace } from '@/features/chat-qa';

export default function Screen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = params.conversationId?.trim() || null;
  return <ChatQaWorkspace initialConversationId={conversationId} />;
}
