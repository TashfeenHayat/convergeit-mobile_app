import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ConversationTypingEntry } from "@/lib/hooks/chat/conversation-typing-bus";
import { typingEntriesToPreviews } from "@/lib/hooks/chat/typing-preview-display";
import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import type { AgentVisitorPresentation, ChatMessage } from "@/services/chat/chat.types";
import type { AiChatMessage } from "../types/ai-chat";
import { parseVisitorInfo } from "../utils/visitor-info";
import type { ChatWhisperSocketPayload } from "@/services/chat/supervisor.types";
import { ChatContextRail } from "./ChatContextRail";
import { ChatTranscriptStatusChip } from "./ChatTranscriptStatusChip";
import { CLOSED_CHAT_BUCKETS, resolveClosedChatBucket } from "../utils/chat-close-outcome";
import { GuestLinkHeaderAction } from "./GuestLinkHeaderAction";
import { TransferChatHeaderAction } from "./TransferChatHeaderAction";
import { inboxTranscriptDisplayForClosed } from "../utils/inbox-transcript-messages";
import { ChatWhisperComposerStrip } from "./ChatWhisperComposerStrip";
import { ChatComposer } from "./ChatComposer";
import { ChatDistributionLinkBanner } from "./ChatDistributionLinkBanner";
import { ChatMessageList } from "./ChatMessageList";
import { VisitorProfileCaptureMenu } from "./VisitorProfileCaptureMenu";
import type { VisitorProfileField } from "@/services/chat/visitor-profile.types";
import { ChatHeaderMetaChip, PanelColumn, PanelHeader, QueueAvatar } from "../styles/chat-operations.styled";

interface ChatConversationPanelProps {
  conversationId: string | null;
  messages: ChatMessage[];
  visitor: Record<string, unknown> | null;
  conversationMeta?: Record<string, unknown> | null;
  visitorPresentation?: AgentVisitorPresentation | null;
  readOnly?: boolean;
  assignedAgentLabel?: string;
  visitorTyping: boolean;
  visitorTypingDraft?: string;
  remoteTypingEntries?: ConversationTypingEntry[];
  composer: string;
  onComposerChange: (value: string) => void;
  onSend: () => void;
  onTyping: (draft?: string) => void;
  onStopTyping: () => void;
  onInsertCanned: (text: string) => void;
  onDismissConversation?: () => void;
  showBackButton?: boolean;
  onMarkSpam?: () => void;
  canSend: boolean;
  aiMessages: AiChatMessage[];
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  onSendAiPrompt: (prompt: string, action?: AgentAiAction) => void;
  onApplyAiToComposer: (text: string) => void;
  aiBusy: boolean;
  websiteRequiredDisabled?: boolean;
  availabilityHint?: string | null;
  websiteId?: string | null;
  departmentId?: string | null;
  activeWhisper?: ChatWhisperSocketPayload | null;
  onApplyWhisperToComposer?: (text: string) => void;
  onDismissWhisper?: () => void;
  distributionFormHref?: string | null;
  requiresDistributionForm?: boolean;
  distributionSubmitted?: boolean;
  hasOperational?: (p: string) => boolean;
  profileCaptureEnabled?: boolean;
  onCaptureField?: (field: VisitorProfileField, value: string, source: { messageId?: string; sourceText?: string }) => void | Promise<void>;
  profileCaptureBusy?: boolean;
  agentInboxEnabled?: boolean;
  copilotEnabled?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ChatConversationPanel({
  conversationId,
  messages,
  visitor,
  conversationMeta,
  visitorPresentation = null,
  readOnly = false,
  assignedAgentLabel = "You",
  visitorTyping,
  remoteTypingEntries = [],
  composer,
  onComposerChange,
  onSend,
  onTyping,
  onStopTyping,
  onInsertCanned,
  onDismissConversation,
  onMarkSpam,
  showBackButton = false,
  canSend,
  aiMessages,
  aiPrompt,
  onAiPromptChange,
  onSendAiPrompt,
  onApplyAiToComposer,
  aiBusy,
  websiteRequiredDisabled = false,
  availabilityHint = null,
  websiteId = null,
  activeWhisper = null,
  onApplyWhisperToComposer,
  onDismissWhisper,
  distributionFormHref = null,
  requiresDistributionForm = false,
  distributionSubmitted = false,
  profileCaptureEnabled = false,
  onCaptureField,
  profileCaptureBusy = false,
  agentInboxEnabled = true,
  copilotEnabled = true,
  hasOperational = () => false,
}: ChatConversationPanelProps) {
  const [captureMessage, setCaptureMessage] = useState<ChatMessage | null>(null);
  const visitorInfo = parseVisitorInfo(visitor, conversationMeta ?? undefined);
  const serviceChannel = typeof conversationMeta?.serviceChannel === "string" ? conversationMeta.serviceChannel : null;
  const lastTransferFrom =
    conversationMeta?.lastTransferFrom &&
    typeof conversationMeta.lastTransferFrom === "object" &&
    typeof (conversationMeta.lastTransferFrom as { label?: string }).label === "string"
      ? (conversationMeta.lastTransferFrom as { label: string; userId?: string; transferredAt?: string })
      : null;
  const headerTitle = visitorPresentation?.inboxTitle?.trim() || visitorPresentation?.displayName?.trim() || visitorInfo.displayName;
  const headerSubtitle = visitorPresentation ? [visitorPresentation.originLabel, visitorPresentation.locationLabel].filter(Boolean).join(" · ") : null;
  const [elapsedSec, setElapsedSec] = useState(0);

  const sessionStartMs = visitorInfo.sessionStartedAt
    ? new Date(visitorInfo.sessionStartedAt).getTime()
    : messages[0]?.createdAt
      ? new Date(messages[0].createdAt).getTime()
      : null;

  useEffect(() => {
    if (!conversationId || !sessionStartMs || Number.isNaN(sessionStartMs)) {
      setElapsedSec(0);
      return;
    }
    const tick = () => setElapsedSec(Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [conversationId, sessionStartMs]);

  const pageCount = Math.max(visitorInfo.journey.length, visitorInfo.currentPageUrl ? 1 : 0);
  const hasConversation = Boolean(conversationId);

  const transcriptDisplay = useMemo(() => {
    const closeBucket = conversationMeta
      ? resolveClosedChatBucket({
          closeBucket: typeof conversationMeta.closeBucket === "string" ? conversationMeta.closeBucket : null,
          closeOutcome: typeof conversationMeta.closeOutcome === "string" ? conversationMeta.closeOutcome : null,
          requiresDistributionForm: Boolean(conversationMeta.requiresDistributionForm),
          distributionSubmitted: Boolean(conversationMeta.distributionSubmitted),
        })
      : null;

    if (!readOnly) return { hidePostCloseForms: true };
    if (closeBucket === CLOSED_CHAT_BUCKETS.COMPLETED || closeBucket === CLOSED_CHAT_BUCKETS.SPAM) {
      return { hidePostCloseForms: true };
    }
    const fromMessages = inboxTranscriptDisplayForClosed(messages);
    if (fromMessages) return fromMessages;
    if (requiresDistributionForm && distributionFormHref?.trim()) {
      return { requiresDistributionForm: true, distributionFormHref: distributionFormHref.trim() };
    }
    return { hidePostCloseForms: true };
  }, [conversationMeta, messages, readOnly, requiresDistributionForm, distributionFormHref]);

  void typingEntriesToPreviews(remoteTypingEntries, {
    visitorDisplayName: visitorInfo.displayName,
    agentDisplayName: assignedAgentLabel,
  });

  return (
    <PanelColumn style={{ flex: 1 }}>
      {hasConversation ? (
        <PanelHeader style={{ gap: 10 }}>
          <View style={styles.headerRow}>
            {showBackButton && onDismissConversation ? (
              <Pressable onPress={onDismissConversation} style={styles.backBtn} accessibilityLabel="Back to conversations">
                <Ionicons name="arrow-back" size={18} color={tokens.colors.textPrimary} />
              </Pressable>
            ) : null}
            <QueueAvatar style={{ width: 44, height: 44, backgroundColor: "#0084FF", borderWidth: 0 }}>
              <Typography variant="medium" style={{ fontWeight: "700", color: "#fff" }}>
                {visitorInfo.initials}
              </Typography>
            </QueueAvatar>
            <View style={{ minWidth: 0, flex: 1 }}>
              <Typography variant="medium16" style={{ fontWeight: "700" }} numberOfLines={1}>
                {headerTitle}
              </Typography>
              {headerSubtitle ? (
                <Typography variant="small" muted style={{ fontSize: 11 }} numberOfLines={1}>
                  {headerSubtitle}
                </Typography>
              ) : null}
              {lastTransferFrom?.label ? (
                <Typography variant="small" style={{ fontSize: 10, fontWeight: "600", color: tokens.colors.accentOrange }} numberOfLines={1}>
                  Transferred by {lastTransferFrom.label}
                </Typography>
              ) : null}
            </View>
            <View style={styles.headerActions}>
              {!readOnly ? (
                <>
                  <TransferChatHeaderAction conversationId={conversationId} />
                  <GuestLinkHeaderAction conversationId={conversationId} hasOperational={hasOperational} serviceChannel={serviceChannel} />
                </>
              ) : null}
              {onMarkSpam ? (
                <Button variant="secondary" size="compact" onPress={onMarkSpam}>
                  Mark spam
                </Button>
              ) : null}
            </View>
          </View>

          <View style={styles.metaRow}>
            <ChatTranscriptStatusChip conversationMeta={conversationMeta} readOnly={readOnly} visitorTyping={visitorTyping} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <ChatHeaderMetaChip>
                <Typography variant="small" muted style={{ fontSize: 9 }}>
                  Session
                </Typography>
                <Typography variant="small" style={{ fontWeight: "700" }}>
                  {formatDuration(elapsedSec)}
                </Typography>
              </ChatHeaderMetaChip>
              <ChatHeaderMetaChip>
                <Typography variant="small" muted style={{ fontSize: 9 }}>
                  Pages
                </Typography>
                <Typography variant="small" style={{ fontWeight: "700" }}>
                  {pageCount}
                </Typography>
              </ChatHeaderMetaChip>
            </View>
          </View>
        </PanelHeader>
      ) : null}

      {hasConversation && readOnly && requiresDistributionForm && distributionFormHref?.trim() ? (
        <View style={{ paddingHorizontal: tokens.space.md, paddingTop: tokens.space.sm }}>
          <ChatDistributionLinkBanner
            href={distributionFormHref.trim()}
            submitted={distributionSubmitted}
            hint="Chat closed. Open the distribution form to send the transcript to a department."
            buttonLabel="Open distribution form"
            submittedHint="Distribution form already submitted for this chat."
          />
        </View>
      ) : null}

      <View style={{ flex: 1, minHeight: 0 }}>
        <ChatMessageList
          conversationId={conversationId}
          messages={messages}
          transcriptDisplay={transcriptDisplay}
          visitorInitials={visitorInfo.initials}
          visitorTyping={visitorTyping}
          visitorDisplayName={visitorInfo.displayName}
          agentDisplayName={assignedAgentLabel}
          showEmptyPlaceholder={!hasConversation}
          profileCaptureEnabled={profileCaptureEnabled}
          onLongPressVisitorMessage={onCaptureField ? (message) => setCaptureMessage(message) : undefined}
        />
      </View>

      {!readOnly ? <ChatContextRail hasConversation={hasConversation} readOnly={readOnly} availabilityHint={availabilityHint} /> : null}

      {activeWhisper && onApplyWhisperToComposer && onDismissWhisper && !readOnly ? (
        <ChatWhisperComposerStrip
          payload={activeWhisper}
          onInsert={(text) => {
            onApplyWhisperToComposer(text);
            onDismissWhisper();
          }}
          onDismiss={onDismissWhisper}
        />
      ) : null}

      <ChatComposer
        value={composer}
        onChange={onComposerChange}
        onSend={onSend}
        onTyping={onTyping}
        onStopTyping={onStopTyping}
        disabled={!canSend || readOnly}
        onInsertCanned={onInsertCanned}
        websiteId={websiteId}
        aiMessages={aiMessages}
        aiPrompt={aiPrompt}
        onAiPromptChange={onAiPromptChange}
        onSendAiPrompt={onSendAiPrompt}
        onApplyAiToComposer={onApplyAiToComposer}
        aiBusy={aiBusy}
        websiteRequiredDisabled={websiteRequiredDisabled}
        hasConversation={hasConversation}
        agentInboxEnabled={agentInboxEnabled}
        copilotEnabled={copilotEnabled}
      />

      {onCaptureField ? (
        <VisitorProfileCaptureMenu
          open={Boolean(captureMessage)}
          message={captureMessage}
          busy={profileCaptureBusy}
          onClose={() => setCaptureMessage(null)}
          onCapture={(field: VisitorProfileField, value) => {
            void onCaptureField(field, value, { messageId: captureMessage?.id, sourceText: value });
            setCaptureMessage(null);
          }}
        />
      ) : null}
    </PanelColumn>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
});
