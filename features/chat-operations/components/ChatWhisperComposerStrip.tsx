import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatWhisperSocketPayload } from "@/services/chat/supervisor.types";

const VIOLET = "#A855F7";

function supervisorName(payload: ChatWhisperSocketPayload): string {
  const u = payload.whisper.fromUser;
  if (!u) return "Supervisor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || "Supervisor";
}

type Props = {
  payload: ChatWhisperSocketPayload;
  onInsert: (text: string) => void;
  onDismiss: () => void;
};

/** Compact whisper hint above the composer — not shown in the message thread. */
export function ChatWhisperComposerStrip({ payload, onInsert, onDismiss }: Props) {
  return (
    <View style={styles.strip}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="small" style={{ fontWeight: "700", color: VIOLET, fontSize: 11 }}>
          Whisper from {supervisorName(payload)} · visitors cannot see this
        </Typography>
        <Typography variant="small" style={{ marginTop: 3, lineHeight: 18 }}>
          {payload.whisper.message}
        </Typography>
      </View>
      <View style={styles.actions}>
        <Button variant="primary" size="compact" onPress={() => onInsert(payload.whisper.message)}>
          Insert
        </Button>
        <Pressable onPress={onDismiss} hitSlop={8} accessibilityLabel="Dismiss whisper" style={styles.dismissBtn}>
          <Ionicons name="close" size={16} color={tokens.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginHorizontal: tokens.space.md,
    marginBottom: 6,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
    backgroundColor: "rgba(168, 85, 247, 0.1)",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  dismissBtn: {
    padding: 4,
  },
});
