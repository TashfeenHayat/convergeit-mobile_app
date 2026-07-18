import { StyleSheet, View } from "react-native";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAgentChatSession } from "@/lib/hooks/chat/useAgentChatSession";

export function AgentChatSessionToolbar({
  showBackToQueue = false,
  onBackToQueue,
}: {
  showBackToQueue?: boolean;
  onBackToQueue?: () => void;
}) {
  const { session, isAcceptingChats, onMeeting, canStartMeeting, startSession, pauseSession, meetingIn, meetingOut } = useAgentChatSession();

  const statusLabel = isAcceptingChats ? "Receiving chats" : onMeeting ? "In meeting — chat paused for assignments" : "Paused — offline for new chats";
  const statusColor = isAcceptingChats ? tokens.colors.accentGreen : onMeeting ? tokens.colors.accentBlue : tokens.colors.textMuted;

  const chatMinutes = session.attendanceActivity?.chatMinutes;
  const meetingMinutes = session.attendanceActivity?.meetingMinutes;

  return (
    <View style={styles.bar}>
      <View style={{ minWidth: 0, flex: 1 }}>
        <Typography variant="small" style={{ fontWeight: "700" }}>
          Agent availability
        </Typography>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Typography variant="small" style={{ fontSize: 11, color: statusColor }}>
            {statusLabel}
          </Typography>
        </View>
        {chatMinutes != null || meetingMinutes != null ? (
          <Typography variant="small" muted style={{ fontSize: 10, marginTop: 2 }}>
            {chatMinutes != null ? `Chat ${chatMinutes} min` : null}
            {chatMinutes != null && meetingMinutes != null ? " · " : null}
            {meetingMinutes != null ? `Meeting ${meetingMinutes} min` : null}
          </Typography>
        ) : null}
      </View>

      <View style={styles.actions}>
        {showBackToQueue ? (
          <Button variant="secondary" size="compact" onPress={onBackToQueue}>
            Back
          </Button>
        ) : null}

        {onMeeting ? (
          <Button variant="secondary" size="compact" disabled={session.busy} onPress={() => void meetingOut()}>
            {session.busy ? "Ending…" : "Off meeting"}
          </Button>
        ) : (
          <Button variant="secondary" size="compact" disabled={session.busy || !canStartMeeting} onPress={() => void meetingIn()}>
            On meeting
          </Button>
        )}

        {isAcceptingChats ? (
          <Button variant="secondary" size="compact" disabled={session.busy || onMeeting} onPress={() => void pauseSession()}>
            {session.busy ? "Pausing…" : "Chat pause"}
          </Button>
        ) : (
          <Button variant="primary" size="compact" disabled={session.busy || onMeeting} onPress={() => void startSession()}>
            {session.busy ? "Starting…" : "Chat start"}
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    flexShrink: 0,
  },
});
