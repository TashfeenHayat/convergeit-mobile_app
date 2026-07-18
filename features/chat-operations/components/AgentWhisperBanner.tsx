import { StyleSheet, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatWhisperSocketPayload } from "@/services/chat/supervisor.types";

const VIOLET = "#A855F7";

interface AgentWhisperBannerProps {
  payload: ChatWhisperSocketPayload;
  onApplyToComposer: (text: string) => void;
  onDismiss: () => void;
  /** Inside ChatContextRail — no outer chrome. */
  embedded?: boolean;
}

function supervisorName(payload: ChatWhisperSocketPayload): string {
  const u = payload.whisper.fromUser;
  if (!u) return "Supervisor";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return name || u.email || "Supervisor";
}

export function AgentWhisperBanner({ payload, onApplyToComposer, onDismiss, embedded = false }: AgentWhisperBannerProps) {
  return (
    <View style={embedded ? styles.embedded : styles.banner}>
      <Typography variant="small" style={{ fontWeight: "700", color: VIOLET }}>
        Supervisor whisper · {supervisorName(payload)}
      </Typography>
      <Typography variant="small" style={{ marginTop: 4, lineHeight: 18 }}>
        {payload.whisper.message}
      </Typography>
      <Typography variant="small" muted style={{ marginTop: 4, fontSize: 11 }}>
        {payload.agentMustClickSend
          ? "Visitors cannot see this. Add to your reply, then send when ready."
          : "Visitors cannot see this message."}
      </Typography>
      <View style={styles.actions}>
        <Button variant="primary" size="compact" onPress={() => onApplyToComposer(payload.whisper.message)}>
          {payload.agentMustClickSend ? "Add to reply" : "Copy to composer"}
        </Button>
        <Button variant="secondary" size="compact" onPress={onDismiss}>
          Dismiss
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: tokens.space.md,
    marginTop: tokens.space.sm,
    marginBottom: 4,
    padding: tokens.space.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.45)",
    backgroundColor: "rgba(168, 85, 247, 0.12)",
  },
  embedded: {
    padding: 10,
  },
  actions: {
    flexDirection: "row",
    gap: tokens.space.sm,
    marginTop: tokens.space.sm,
  },
});
