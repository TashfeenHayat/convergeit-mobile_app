import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatMessageList } from "@/features/chat-operations/components/ChatMessageList";
import { parseVisitorInfo } from "@/features/chat-operations/utils/visitor-info";
import { extractVisitorPresentation } from "@/services/chat/visitor-presentation";
import { agentDisplayName } from "@/services/chat/monitor-normalizers";
import type { MonitorConversationRow } from "@/services/chat/monitor.types";
import type { ChatMessage } from "@/services/chat/chat.types";

interface MonitorTranscriptPanelProps {
  conversation: MonitorConversationRow | null;
  messages: ChatMessage[];
  visitor: Record<string, unknown> | null;
  loading: boolean;
  loadError?: string | null;
  currentUserId?: string | null;
  monitorReadOnly?: boolean;
  supervisorControlUserId?: string | null;
  visitorTyping?: boolean;
  onDismissConversation?: () => void;
  showBackButton?: boolean;
}

export function MonitorTranscriptPanel({
  conversation,
  messages,
  visitor,
  loading,
  loadError = null,
  currentUserId = null,
  monitorReadOnly = false,
  supervisorControlUserId = null,
  visitorTyping = false,
  onDismissConversation,
  showBackButton = false,
}: MonitorTranscriptPanelProps) {
  const activeSupervisorId = supervisorControlUserId ?? conversation?.supervisorControlUserId ?? null;
  const isControlling = Boolean(activeSupervisorId) && Boolean(currentUserId) && activeSupervisorId === currentUserId;

  const vp = conversation ? extractVisitorPresentation(conversation) : null;
  const visitorInfo = parseVisitorInfo(visitor);
  const title = vp?.inboxTitle || vp?.displayName || visitorInfo.displayName;
  const subtitle = vp ? [vp.originLabel, vp.locationLabel].filter(Boolean).join(" · ") : null;
  const conversationId = conversation?.id ?? null;
  const hasConversation = Boolean(conversation);
  const isClosed = conversation?.status === "closed";
  const agentLabel = agentDisplayName(conversation?.agent ?? null);

  return (
    <View style={styles.root}>
      {hasConversation ? (
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {showBackButton && onDismissConversation ? (
              <Pressable onPress={onDismissConversation} hitSlop={8} style={styles.backButton}>
                <Ionicons name="arrow-back" size={18} color={tokens.colors.textPrimary} />
              </Pressable>
            ) : null}
            <View style={styles.avatar}>
              <Typography variant="small" style={{ fontWeight: "700" }}>
                {visitorInfo.initials}
              </Typography>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="medium" style={{ fontWeight: "700" }} numberOfLines={1}>
                {title}
              </Typography>
              {subtitle ? (
                <Typography variant="small" muted numberOfLines={1}>
                  {subtitle}
                </Typography>
              ) : null}
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.statusChip}>
              <Typography variant="small" style={{ fontSize: 11, fontWeight: "700", textTransform: "capitalize" }}>
                {conversation!.status}
              </Typography>
            </View>
            <View style={styles.agentPill}>
              <Typography variant="small" style={{ fontSize: 11, fontWeight: "600" }} numberOfLines={1}>
                Agent: {agentLabel}
              </Typography>
            </View>
          </View>
        </View>
      ) : null}

      {!isClosed && hasConversation ? (
        <Typography variant="small" muted style={styles.modeLine}>
          {isControlling ? "You are controlling this chat — use Monitor actions below to reply." : monitorReadOnly ? "Read-only monitor view." : "Monitoring — no direct replies from this screen."}
        </Typography>
      ) : null}

      {loadError ? (
        <View style={styles.centerFill}>
          <Typography style={{ color: tokens.colors.danger }}>{loadError}</Typography>
        </View>
      ) : loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
        </View>
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <ChatMessageList
            conversationId={conversationId}
            messages={messages}
            visitorInitials={visitorInfo.initials}
            visitorTyping={visitorTyping && !isClosed}
            visitorDisplayName={title}
            agentDisplayName={agentLabel}
            showEmptyPlaceholder={!hasConversation}
            profileCaptureEnabled={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  header: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
    gap: 8,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { padding: 4 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(88,101,242,0.16)",
  },
  agentPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  modeLine: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: 6,
  },
  centerFill: { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.space.lg },
});
