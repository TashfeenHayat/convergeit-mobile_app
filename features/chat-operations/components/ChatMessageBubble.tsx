import { Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatMessage } from "@/services/chat/chat.types";
import { isInboxFormLinkMessage } from "../utils/inbox-transcript-messages";
import { isSupervisorSentMessage, resolveMessageSenderLabel } from "../utils/message-sender-label";
import { formatMessageTime } from "../utils/format-message-time";
import type { MessageGroupPosition } from "../utils/message-grouping";
import { shouldShowMessageAvatar, shouldShowMessageMeta } from "../utils/message-grouping";
import { ChatMessageContent } from "./ChatMessageContent";

/** Messenger-style blue for agent bubbles */
const MESSENGER_BLUE = "#0084FF";
const INCOMING_BUBBLE = "#3A3B3C";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  visitorInitials?: string;
  visitorDisplayName?: string;
  agentDisplayName?: string;
  groupPosition?: MessageGroupPosition;
  profileCaptureEnabled?: boolean;
  onLongPressVisitorMessage?: (message: ChatMessage) => void;
}

export function ChatMessageBubble({
  message,
  visitorInitials = "V",
  visitorDisplayName = "Visitor",
  agentDisplayName = "You",
  groupPosition = "single",
  profileCaptureEnabled = false,
  onLongPressVisitorMessage,
}: ChatMessageBubbleProps) {
  const isSystem = message.role === "system";
  const isAi = message.role === "ai";
  const isAgent = message.role === "agent";
  const isVisitor = message.role === "visitor";
  const isFormLink = isInboxFormLinkMessage(message);
  const isSupervisor = isSupervisorSentMessage(message);
  const isOutgoing = (isAgent || isAi) && !isFormLink;
  const showAvatar = shouldShowMessageAvatar(message, groupPosition);
  const showMeta = shouldShowMessageMeta(groupPosition);
  const senderLabel = resolveMessageSenderLabel(message, { visitorDisplayName, agentDisplayName });
  const rowMargin = groupPosition === "middle" || groupPosition === "first" ? 1 : 8;

  if (isFormLink) {
    return (
      <View style={{ width: "100%", marginVertical: 6 }}>
        <ChatMessageContent message={message} textColor={tokens.colors.textPrimary} />
      </View>
    );
  }

  if (isSystem) {
    return (
      <View style={[styles.rowOuterSystem, { marginBottom: rowMargin }]}>
        <View style={styles.bubbleSystem}>
          <ChatMessageContent message={message} textColor={tokens.colors.textMuted} />
        </View>
      </View>
    );
  }

  const bubbleStyle = [
    styles.bubble,
    isOutgoing ? (isAi ? styles.bubbleAi : styles.bubbleAgent) : styles.bubbleVisitor,
    bubbleRadiusStyle(isOutgoing, groupPosition),
  ];

  const bubbleContent = (
    <View style={bubbleStyle}>
      <ChatMessageContent message={message} textColor="#FFFFFF" />
    </View>
  );

  return (
    <View style={[styles.rowOuter, isOutgoing ? styles.rowOuterEnd : styles.rowOuterStart, { marginBottom: rowMargin }]}>
      {!isOutgoing && showAvatar ? (
        <View style={styles.avatar}>
          <Typography variant="small" style={{ fontWeight: "700", color: "#fff" }}>
            {visitorInitials}
          </Typography>
        </View>
      ) : !isOutgoing ? (
        <View style={styles.avatarSpacer} />
      ) : null}

      <View style={[styles.column, isOutgoing && styles.columnEnd]}>
        {isVisitor && profileCaptureEnabled && onLongPressVisitorMessage ? (
          <Pressable onLongPress={() => onLongPressVisitorMessage(message)} delayLongPress={350}>
            {bubbleContent}
          </Pressable>
        ) : (
          bubbleContent
        )}
        {showMeta ? (
          <View style={[styles.metaRow, isOutgoing && styles.metaRowEnd]}>
            <Typography variant="small" muted numberOfLines={1} style={{ fontSize: 11 }}>
              {message.createdAt ? formatMessageTime(message.createdAt) : senderLabel}
            </Typography>
            {isAgent ? <FontAwesome name="check" size={10} color="#0084FF" /> : null}
          </View>
        ) : null}
      </View>

      {isOutgoing && showAvatar ? (
        <View style={[styles.avatar, isAi ? styles.avatarAi : styles.avatarOut]}>
          <Typography variant="small" style={{ fontWeight: "700", color: "#fff" }}>
            {isAi ? "AI" : isSupervisor ? "S" : agentDisplayName.charAt(0).toUpperCase() || "A"}
          </Typography>
        </View>
      ) : isOutgoing ? (
        <View style={styles.avatarSpacer} />
      ) : null}
    </View>
  );
}

function bubbleRadiusStyle(outgoing: boolean, position: MessageGroupPosition) {
  const r = 20;
  const t = 4;
  if (outgoing) {
    switch (position) {
      case "first":
        return { borderRadius: r, borderBottomRightRadius: t };
      case "middle":
        return { borderRadius: r, borderTopRightRadius: t, borderBottomRightRadius: t };
      case "last":
        return { borderRadius: r, borderTopRightRadius: t };
      default:
        return { borderRadius: r };
    }
  }
  switch (position) {
    case "first":
      return { borderRadius: r, borderBottomLeftRadius: t };
    case "middle":
      return { borderRadius: r, borderTopLeftRadius: t, borderBottomLeftRadius: t };
    case "last":
      return { borderRadius: r, borderTopLeftRadius: t };
    default:
      return { borderRadius: r };
  }
}

export function ChatDateDivider({ label }: { label: string }) {
  return (
    <View style={styles.dateDivider}>
      <View style={styles.datePill}>
        <Typography variant="small" style={styles.datePillText}>
          {label}
        </Typography>
      </View>
    </View>
  );
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Earlier";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function groupMessagesByDate(messages: ChatMessage[]) {
  const groups: Array<{ dateKey: string; label: string; messages: ChatMessage[] }> = [];
  for (const message of messages) {
    const key = message.createdAt?.slice(0, 10) ?? "unknown";
    const label = message.createdAt ? formatDateLabel(message.createdAt) : "Earlier";
    const last = groups[groups.length - 1];
    if (last?.dateKey === key) {
      last.messages.push(message);
    } else {
      groups.push({ dateKey: key, label, messages: [message] });
    }
  }
  return groups;
}

const styles = StyleSheet.create({
  rowOuter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    maxWidth: "85%",
  },
  rowOuterStart: {
    alignSelf: "flex-start",
  },
  rowOuterEnd: {
    alignSelf: "flex-end",
  },
  rowOuterSystem: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  column: {
    flexShrink: 1,
    minWidth: 0,
    gap: 3,
    alignItems: "flex-start",
  },
  columnEnd: {
    alignItems: "flex-end",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5E5E60",
  },
  avatarOut: {
    backgroundColor: MESSENGER_BLUE,
  },
  avatarAi: {
    backgroundColor: "#6366F1",
  },
  avatarSpacer: {
    width: 28,
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: "100%",
  },
  bubbleVisitor: {
    backgroundColor: INCOMING_BUBBLE,
  },
  bubbleAgent: {
    backgroundColor: MESSENGER_BLUE,
  },
  bubbleAi: {
    backgroundColor: "#6366F1",
  },
  bubbleSystem: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    maxWidth: "90%",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
  },
  metaRowEnd: {
    justifyContent: "flex-end",
  },
  dateDivider: {
    alignItems: "center",
    marginVertical: 14,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  datePillText: {
    fontWeight: "600",
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 0.2,
  },
});
