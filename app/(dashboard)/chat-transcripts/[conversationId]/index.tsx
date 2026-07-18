import { useLocalSearchParams } from 'expo-router';
import { ChatTranscriptDetailWorkspace } from '@/features/chat-transcripts';

export default function Screen() {
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = String(params.conversationId ?? '').trim();
  if (!conversationId) return null;
  return <ChatTranscriptDetailWorkspace conversationId={conversationId} />;
}
