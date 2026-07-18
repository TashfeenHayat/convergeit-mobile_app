import { useState } from "react";
import { View } from "react-native";
import { Button, InputField, Typography } from "@/components/ui";
import { canWhisper } from "@/lib/permissions/chat-access";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import type { useConversationSupervisor } from "../hooks/useConversationSupervisor";
import { ChatSideToolCard } from "@/features/chat-shared";

interface SupervisorToolsPanelProps {
  conversationId: string | null;
  assignedAgentId: string | null;
  currentUserId?: string;
  hasOperational: (p: string) => boolean;
  supervisor: ReturnType<typeof useConversationSupervisor>;
}

export function SupervisorToolsPanel({ conversationId, assignedAgentId, currentUserId, hasOperational, supervisor }: SupervisorToolsPanelProps) {
  const [whisperText, setWhisperText] = useState("");
  const [busy, setBusy] = useState(false);

  const showWhisper = canWhisper(hasOperational);

  if (!conversationId || !showWhisper || !assignedAgentId || assignedAgentId === currentUserId) {
    return null;
  }

  const sendWhisper = async () => {
    setBusy(true);
    try {
      await supervisor.sendWhisper(whisperText.trim());
      setWhisperText("");
      publishAppToast({ variant: "success", message: "Whisper sent to the assigned agent." });
    } catch (err) {
      publishAppToast({ variant: "error", message: extractApiErrorMessageForToast(err) ?? "Could not send whisper." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ChatSideToolCard accent="supervisor" title="Supervisor tools" subtitle="Whispers are only visible to the assigned agent, not the visitor.">
      <View>
        <InputField label="Whisper to agent" value={whisperText} onChangeText={setWhisperText} editable={!busy} />
        <Button variant="secondary" disabled={busy || !whisperText.trim()} onPress={() => void sendWhisper()} style={{ marginTop: 8 }}>
          Send whisper
        </Button>
        <Typography variant="small" muted style={{ marginTop: 6 }}>
          Takeover requests are not used — assign chats from the queue instead.
        </Typography>
      </View>
    </ChatSideToolCard>
  );
}
