import { useMemo, useRef } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatMessage } from "@/services/chat/chat.types";
import type { VisitorProfileField } from "@/services/chat/visitor-profile.types";
import { getMessageGroupPosition } from "../utils/message-grouping";
import { prepareInboxTranscriptMessages, type InboxTranscriptDisplayOptions } from "../utils/inbox-transcript-messages";
import { ChatDateDivider, ChatMessageBubble, groupMessagesByDate } from "./ChatMessageBubble";

export interface VisitorProfileCaptureSelection {
  text: string;
  messageId: string;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  conversationId?: string | null;
  visitorInitials?: string;
  visitorTyping?: boolean;
  visitorDisplayName?: string;
  agentDisplayName?: string;
  showEmptyPlaceholder?: boolean;
  transcriptDisplay?: InboxTranscriptDisplayOptions;
  profileCaptureEnabled?: boolean;
  onCaptureField?: (field: VisitorProfileField, selection: VisitorProfileCaptureSelection) => void | Promise<void>;
  onLongPressVisitorMessage?: (message: ChatMessage) => void;
}

export function ChatMessageList({
  messages,
  conversationId = null,
  visitorInitials = "V",
  visitorTyping = false,
  visitorDisplayName = "Visitor",
  agentDisplayName = "You",
  showEmptyPlaceholder = false,
  transcriptDisplay,
  profileCaptureEnabled = false,
  onLongPressVisitorMessage,
}: ChatMessageListProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const displayMessages = useMemo(() => prepareInboxTranscriptMessages(messages, transcriptDisplay), [messages, transcriptDisplay]);
  const groups = groupMessagesByDate(displayMessages);

  if (displayMessages.length === 0 && !visitorTyping) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIconRing}>
          <FontAwesome name={showEmptyPlaceholder ? "inbox" : "comments"} size={30} color="#0084FF" />
        </View>
        <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
          {showEmptyPlaceholder ? "Pick a conversation" : "Say hello"}
        </Typography>
        <Typography variant="small" muted style={{ textAlign: "center", maxWidth: 280 }}>
          {showEmptyPlaceholder
            ? "Choose a visitor from Messages to start chatting."
            : "Send a reply below when you're ready to help."}
        </Typography>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.thread}
      contentContainerStyle={styles.threadContent}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      keyboardShouldPersistTaps="handled"
    >
      {groups.map((group) => (
        <View key={group.dateKey}>
          <ChatDateDivider label={group.label} />
          {group.messages.map((message, idx) => (
            <ChatMessageBubble
              key={message.id ?? `${group.dateKey}-${idx}-${message.createdAt}`}
              message={message}
              visitorInitials={visitorInitials}
              visitorDisplayName={visitorDisplayName}
              agentDisplayName={agentDisplayName}
              groupPosition={getMessageGroupPosition(idx, group.messages)}
              profileCaptureEnabled={profileCaptureEnabled}
              onLongPressVisitorMessage={onLongPressVisitorMessage}
            />
          ))}
        </View>
      ))}

      {visitorTyping ? (
        <View style={styles.typingIndicator}>
          <Typography variant="small" muted style={{ fontWeight: "600" }}>
            {visitorDisplayName} is typing…
          </Typography>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  thread: {
    flex: 1,
  },
  threadContent: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    paddingBottom: tokens.space.lg,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.md,
    padding: tokens.space.xl,
  },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 132, 255, 0.14)",
  },
  typingIndicator: {
    alignSelf: "flex-start",
    marginLeft: 34,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#3A3B3C",
    marginTop: 4,
  },
});
