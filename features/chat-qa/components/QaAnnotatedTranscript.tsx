import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatMessageList } from "@/features/chat-operations/components/ChatMessageList";
import { parseVisitorInfo } from "@/features/chat-operations/utils/visitor-info";
import { extractVisitorPresentation } from "@/services/chat/visitor-presentation";
import type { ChatMessage } from "@/services/chat/chat.types";
import type {
  MessageQaAnnotation,
  QaReviewBundle,
  UpsertQaMessageAnnotationBody,
} from "@/services/chat/qa.types";
import { agentDisplayName } from "@/services/chat/monitor-normalizers";
import { chatQaStyles } from "../styles/chat-qa.styles";
import { QaMessageAnnotationDialog } from "./QaMessageAnnotationDialog";

interface QaAnnotatedTranscriptProps {
  bundle: QaReviewBundle | null;
  messages: ChatMessage[];
  visitor: Record<string, unknown> | null;
  loading: boolean;
  canAnnotate: boolean;
  annotationsByMessageId: Map<string, MessageQaAnnotation>;
  onSaveAnnotation: (messageId: string, body: UpsertQaMessageAnnotationBody) => Promise<void>;
  saving?: boolean;
}

export function QaAnnotatedTranscript({
  bundle,
  messages,
  visitor,
  loading,
  canAnnotate,
  annotationsByMessageId,
  onSaveAnnotation,
  saving = false,
}: QaAnnotatedTranscriptProps) {
  const [annotateMessageId, setAnnotateMessageId] = useState<string | null>(null);

  const vp = bundle?.transcript ? extractVisitorPresentation(bundle.transcript as Record<string, unknown>) : null;
  const visitorInfo = parseVisitorInfo(visitor, bundle?.transcript as Record<string, unknown>);
  const title = vp?.inboxTitle || vp?.displayName || visitorInfo.displayName;
  const agent =
    bundle?.transcript && typeof bundle.transcript === "object"
      ? (bundle.transcript as { agent?: unknown }).agent
      : null;

  const selectedMessage = messages.find((m) => m.id === annotateMessageId);
  const selectedAnnotation = annotateMessageId ? annotationsByMessageId.get(annotateMessageId) ?? null : null;

  if (!bundle) {
    return (
      <View style={styles.empty}>
        <Typography variant="medium" muted>
          Select a chat from the queue to review the transcript.
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={chatQaStyles.reviewBanner}>
        <Typography variant="small" muted>
          {canAnnotate ? "Long-press a message to annotate (tap message row in list below)." : "Read-only transcript."}
        </Typography>
      </View>
      <View style={styles.header}>
        <Typography variant="medium" style={{ fontWeight: "700" }}>
          {title}
        </Typography>
        <Typography variant="small" muted>
          Agent: {agentDisplayName(agent as Parameters<typeof agentDisplayName>[0])}
        </Typography>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
        </View>
      ) : (
        <View style={{ flex: 1, minHeight: 280 }}>
          <ChatMessageList
            conversationId={bundle.review?.conversationId ?? null}
            messages={messages}
            visitorInitials={visitorInfo.initials}
            visitorDisplayName={title}
            agentDisplayName={agentDisplayName(agent as Parameters<typeof agentDisplayName>[0])}
            profileCaptureEnabled={false}
          />
        </View>
      )}

      {canAnnotate ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.annotationStrip}>
          {messages
            .filter((m) => m.role === "agent" || m.role === "visitor")
            .slice(-12)
            .map((m) => {
              const messageId = m.id ?? "";
              if (!messageId) return null;
              const ann = annotationsByMessageId.get(messageId);
              return (
                <Pressable key={messageId} style={styles.annotationChip} onPress={() => setAnnotateMessageId(messageId)}>
                  <Typography variant="small" numberOfLines={2}>
                    {m.content.slice(0, 48)}
                    {ann?.rating != null ? ` ★${ann.rating}` : ""}
                  </Typography>
                </Pressable>
              );
            })
            .filter(Boolean)}
        </ScrollView>
      ) : null}

      <QaMessageAnnotationDialog
        open={Boolean(annotateMessageId && selectedMessage)}
        messagePreview={selectedMessage?.content ?? ""}
        existing={selectedAnnotation}
        onClose={() => setAnnotateMessageId(null)}
        onSave={(body) => onSaveAnnotation(annotateMessageId!, body)}
        saving={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: tokens.space.lg },
  header: { paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm, gap: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  annotationStrip: { maxHeight: 72, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.colors.border },
  annotationChip: {
    margin: tokens.space.xs,
    padding: tokens.space.sm,
    maxWidth: 160,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
});
