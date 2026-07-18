import { useState } from "react";
import { View } from "react-native";
import { Button, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import {
  createGuestWhisper,
  releaseGuestDirectControl,
  sendGuestDirectControlMessage,
  startGuestDirectControl,
  type GuestSocketClient,
} from "@/services/chat/guest.api";
import type { StoredGuestSession } from "@/lib/chat/guest-session";
import { chatGuestStyles as styles } from "../styles/chat-guest.styles";

interface GuestSupervisorActionsProps {
  session: StoredGuestSession;
  supervisorControlUserId?: string | null;
  assignedAgentId?: string | null;
  chatCompleted?: boolean;
  onOptimisticAgentMessage?: (content: string) => void;
  onLiveTyping?: (draft?: string) => void;
  onActionComplete?: () => void;
  guestSocket?: GuestSocketClient;
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string | string[] } } }).response?.data;
    const msg = data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg) && msg[0]) return String(msg[0]);
  }
  return "Request failed. Try again.";
}

export function GuestSupervisorActions({
  session,
  supervisorControlUserId,
  assignedAgentId,
  chatCompleted = false,
  onOptimisticAgentMessage,
  onLiveTyping,
  onActionComplete,
  guestSocket,
}: GuestSupervisorActionsProps) {
  const [whisperText, setWhisperText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const { whisper, directControl } = session.permissions;
  const involvementUserId = session.involvementUserId ?? null;
  const isControlling =
    Boolean(supervisorControlUserId) &&
    Boolean(involvementUserId) &&
    supervisorControlUserId === involvementUserId;

  const showWhisper = whisper && Boolean(assignedAgentId) && !isControlling && !chatCompleted;
  const showDirectControl = directControl && Boolean(involvementUserId) && !chatCompleted;

  if (!showWhisper && !showDirectControl) return null;

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
      onActionComplete?.();
    } catch (err) {
      setStatus(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const sessionLabel = `${session.websiteLabel ? `${session.websiteLabel} · ` : ""}${session.departmentName ?? "Department"}`;

  return (
    <View style={styles.supervisorPanel}>
      <Typography variant="small" muted style={styles.supervisorSectionLabel}>
        Supervisor · {sessionLabel}
      </Typography>

      {showWhisper ? (
        <View style={styles.supervisorColumn}>
          <Typography variant="label" style={{ fontWeight: "700" }}>
            Whisper
          </Typography>
          <Typography variant="small" muted>
            Private note to the agent — visitor cannot see this.
          </Typography>
          <InputField
            placeholder="e.g. offer a discount or escalate"
            value={whisperText}
            onChangeText={setWhisperText}
            editable={!busy}
            multiline
            numberOfLines={2}
          />
          <Button
            variant="secondary"
            size="compact"
            disabled={busy || !whisperText.trim()}
            onPress={() =>
              void run(async () => {
                await createGuestWhisper(
                  session.conversationId,
                  session.accessToken,
                  whisperText.trim(),
                  guestSocket,
                );
                setWhisperText("");
                setStatus("Whisper sent to the agent.");
              })
            }
          >
            Send whisper
          </Button>
        </View>
      ) : null}

      {showDirectControl ? (
        <View style={styles.supervisorColumn}>
          <Typography variant="label" style={{ fontWeight: "700" }}>
            Take over
          </Typography>
          <Typography variant="small" muted>
            Reply to the visitor yourself; the assigned agent becomes read-only.
          </Typography>
          {!isControlling ? (
            <Button
              variant="primary"
              size="compact"
              disabled={busy}
              onPress={() =>
                void run(async () => {
                  await startGuestDirectControl(
                    session.conversationId,
                    session.accessToken,
                    guestSocket,
                  );
                  setStatus("You are controlling this chat.");
                })
              }
            >
              Take over chat
            </Button>
          ) : (
            <>
              <InputField
                placeholder="Type your reply…"
                value={replyText}
                onChangeText={(next) => {
                  setReplyText(next);
                  onLiveTyping?.(next);
                }}
                editable={!busy}
                multiline
                numberOfLines={2}
              />
              <Button
                variant="primary"
                size="compact"
                disabled={busy || !replyText.trim()}
                onPress={() =>
                  void run(async () => {
                    const text = replyText.trim();
                    onOptimisticAgentMessage?.(text);
                    await sendGuestDirectControlMessage(
                      session.conversationId,
                      session.accessToken,
                      text,
                      guestSocket,
                    );
                    setReplyText("");
                    onLiveTyping?.("");
                    setStatus("Message sent to the visitor.");
                  })
                }
              >
                Send to visitor
              </Button>
              <Button
                variant="secondary"
                size="compact"
                disabled={busy}
                onPress={() =>
                  void run(async () => {
                    await releaseGuestDirectControl(
                      session.conversationId,
                      session.accessToken,
                      guestSocket,
                    );
                    setStatus("Chat returned to the assigned agent.");
                  })
                }
              >
                Release control
              </Button>
            </>
          )}
        </View>
      ) : directControl && !involvementUserId ? (
        <View style={styles.supervisorColumn}>
          <Typography variant="label" style={{ fontWeight: "700" }}>
            Take over
          </Typography>
          <Typography variant="small" muted>
            Takeover requires a supervisor account linked to this link email.
          </Typography>
        </View>
      ) : null}

      {status ? (
        <Typography variant="small" color={tokens.colors.accentGreen}>
          {status}
        </Typography>
      ) : null}
    </View>
  );
}
