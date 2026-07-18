import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppCard, Button, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useConversationSupervisor } from "@/features/chat-operations/hooks/useConversationSupervisor";
import { canSupervisorCloseChat, canUseSupervisorTools } from "@/lib/permissions/chat-access";
import {
  releaseDirectSupervisorControl,
  sendSupervisorControlMessage,
  startDirectSupervisorControl,
  supervisorCloseConversation,
} from "@/services/chat/supervisor.api";
import { getSharedAgentChatSocket } from "@/services/chat/sharedAgentChatSocket";

interface MonitorSupervisorSidePanelProps {
  conversationId: string | null;
  supervisorControlUserId: string | null | undefined;
  currentUserId: string | null | undefined;
  hasOperational: (p: string) => boolean;
  readOnly?: boolean;
  onActionComplete?: (payload?: { conversationId: string; supervisorControlUserId?: string | null }) => void;
  onMessageSent?: () => void;
}

/** Monitor-only supervisor tools: whisper to the assigned agent, direct
 * takeover of the conversation, and (where permitted) a supervisor close. */
export function MonitorSupervisorSidePanel({
  conversationId,
  supervisorControlUserId,
  currentUserId,
  hasOperational,
  readOnly = false,
  onActionComplete,
  onMessageSent,
}: MonitorSupervisorSidePanelProps) {
  const socketClient = useMemo(() => getSharedAgentChatSocket(), []);
  const enabled = !readOnly && canUseSupervisorTools(hasOperational) && Boolean(conversationId);
  const supervisor = useConversationSupervisor(conversationId, enabled);

  const [whisperText, setWhisperText] = useState("");
  const [controlMessage, setControlMessage] = useState("");
  const [closeReason, setCloseReason] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const isControlling = Boolean(supervisorControlUserId) && Boolean(currentUserId) && supervisorControlUserId === currentUserId;
  const canClose = canSupervisorCloseChat(hasOperational);

  const emitLiveTyping = useCallback(
    (draft: string) => {
      if (!conversationId || !isControlling) return;
      if (!draft.trim()) {
        socketClient.emitStopTyping({ conversationId, userType: "agent", ...(currentUserId ? { userId: currentUserId } : {}) });
        return;
      }
      socketClient.emitTyping({ conversationId, userType: "agent", ...(currentUserId ? { userId: currentUserId } : {}), draft });
    },
    [conversationId, currentUserId, isControlling, socketClient],
  );

  if (!conversationId || !enabled) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
    } catch {
      setStatus("Request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppCard style={styles.card}>
      <Typography variant="label" style={{ fontWeight: "700" }}>
        Monitor actions
      </Typography>
      <Typography variant="small" muted style={{ marginTop: 2 }}>
        Whisper to the assigned agent or take direct control while monitoring.
      </Typography>

      <InputField label="Whisper to agent" value={whisperText} onChangeText={setWhisperText} editable={!busy} containerStyle={{ marginTop: 10 }} />
      <Button
        variant="outlined"
        size="compact"
        disabled={busy || !whisperText.trim()}
        style={{ marginTop: 8 }}
        onPress={() =>
          void run(async () => {
            await supervisor.sendWhisper(whisperText.trim());
            setWhisperText("");
            setStatus("Whisper sent (agent only, not visible to visitor).");
          })
        }
      >
        Send whisper
      </Button>

      {!isControlling ? (
        <Button
          variant="primary"
          size="compact"
          disabled={busy}
          style={{ marginTop: 12 }}
          onPress={() =>
            void run(async () => {
              const ctrl = await startDirectSupervisorControl(conversationId);
              setStatus("You are controlling this chat. The assigned agent is read-only.");
              onActionComplete?.({ conversationId, supervisorControlUserId: ctrl.supervisorControlUserId });
            })
          }
        >
          Take over chat (direct)
        </Button>
      ) : (
        <>
          <InputField
            label="Message to visitor"
            value={controlMessage}
            onChangeText={(next) => {
              setControlMessage(next);
              emitLiveTyping(next);
            }}
            editable={!busy}
            containerStyle={{ marginTop: 12 }}
          />
          <Button
            variant="primary"
            size="compact"
            disabled={busy || !controlMessage.trim()}
            style={{ marginTop: 8 }}
            onPress={() =>
              void run(async () => {
                await sendSupervisorControlMessage(conversationId, controlMessage.trim());
                setControlMessage("");
                emitLiveTyping("");
                setStatus("Message sent to visitor.");
                onMessageSent?.();
              })
            }
          >
            Send to visitor
          </Button>
          <Button
            variant="outlined"
            size="compact"
            disabled={busy}
            style={{ marginTop: 8 }}
            onPress={() =>
              void run(async () => {
                await releaseDirectSupervisorControl(conversationId);
                setStatus("Chat returned to the assigned agent.");
                onActionComplete?.({ conversationId, supervisorControlUserId: null });
              })
            }
          >
            Return chat to agent
          </Button>
        </>
      )}

      {canClose ? (
        !closeOpen ? (
          <Button variant="outlined" size="compact" disabled={busy} style={{ marginTop: 12 }} onPress={() => setCloseOpen(true)}>
            Close chat
          </Button>
        ) : (
          <View style={{ marginTop: 12 }}>
            <InputField
              label="Close reason"
              value={closeReason}
              onChangeText={setCloseReason}
              editable={!busy}
              multiline
              placeholder="Why is this chat being closed?"
            />
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Button
                variant="primary"
                size="compact"
                style={{ flex: 1 }}
                disabled={busy || !closeReason.trim()}
                onPress={() =>
                  void run(async () => {
                    await supervisorCloseConversation(conversationId, { reason: closeReason.trim() });
                    setCloseReason("");
                    setCloseOpen(false);
                    setStatus("Chat closed.");
                    onActionComplete?.({ conversationId });
                  })
                }
              >
                Confirm close
              </Button>
              <Button
                variant="ghost"
                size="compact"
                disabled={busy}
                onPress={() => {
                  setCloseOpen(false);
                  setCloseReason("");
                }}
              >
                Cancel
              </Button>
            </View>
          </View>
        )
      ) : null}

      {status ? (
        <Typography variant="small" muted style={{ marginTop: 10 }}>
          {status}
        </Typography>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: tokens.space.md },
});
