import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { postAgentAiSuggestion, parseAgentSuggestResponse } from "@/api/ai/agent-suggest.api";
import type { AgentAiAction } from "@/api/ai/agent-suggest.api";
import { useAccessToken } from "@/lib/auth/use-access-token";
import { buildAgentCopilotInput, agentAiActionNeedsWebsite } from "@/lib/ai/agent-copilot-input";
import { useAuth } from "@/lib/auth";
import { Button, PermissionDeniedPanel, Typography } from "@/components/ui";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { OP } from "@/lib/permissions/operational-keys";
import { hasChatInboxOperationalFromChecker } from "@/lib/permissions/chat-inbox-operational";
import { PAGE } from "@/lib/permissions/permission-constants";
import { useAgentChat } from "@/lib/hooks/chat/useAgentChat";
import { setAgentChatFocusedConversation } from "@/lib/hooks/chat/agent-chat-focus-bus";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import type { AgentVisitorPresentation, ConversationSummary } from "@/services/chat/chat.types";
import { extractVisitorPresentation } from "@/services/chat/visitor-presentation";
import { postAgentWebsiteAvailabilityCheck } from "@/services/chat/agent-inbox.api";
import type { VisitorProfileField } from "@/services/chat/visitor-profile.types";
import { tokens } from "@/theme/tokens";
import type { AiChatMessage } from "../types/ai-chat";
import { getConversationAiState, getConversationDraft, patchConversationAiState, patchConversationDraft } from "../utils/conversation-scoped-state";
import { CLOSED_CHAT_BUCKETS, buildDistributionFormHref, resolveClosedChatBucket } from "../utils/chat-close-outcome";
import type { SpamCategoryValue } from "../utils/chat-close-outcome";
import { useVisitorProfileCapture } from "../hooks/useVisitorProfileCapture";
import { ChatConversationPanel } from "./ChatConversationPanel";
import { AgentChatSessionToolbar } from "./AgentChatSessionToolbar";
import { ChatQueueSidebar } from "./ChatQueueSidebar";
import type { ChatQueueTab } from "./ChatQueueSidebar";
import { MarkSpamModal } from "./MarkSpamModal";
import { AgentWrapUpModal } from "./AgentWrapUpModal";
import { AgentDistributionPrompt } from "./AgentDistributionPrompt";
import { VisitorInfoPanel } from "./VisitorInfoPanel";

function needsWebsite(action: AgentAiAction): boolean {
  return agentAiActionNeedsWebsite(action);
}

function splitEndedChats(rows: ConversationSummary[]) {
  const pending: ConversationSummary[] = [];
  const completed: ConversationSummary[] = [];
  const spam: ConversationSummary[] = [];
  for (const row of rows) {
    const bucket = resolveClosedChatBucket(row);
    if (bucket === CLOSED_CHAT_BUCKETS.SPAM) spam.push(row);
    else if (bucket === CLOSED_CHAT_BUCKETS.PENDING) pending.push(row);
    else if (
      bucket === CLOSED_CHAT_BUCKETS.COMPLETED &&
      Boolean((row as Record<string, unknown>).isMeaningfulChat || (row as Record<string, unknown>).distributionSubmitted)
    ) {
      completed.push(row);
    }
  }
  return { pending, completed, spam };
}

function isLiveQueueTab(tab: ChatQueueTab): boolean {
  return tab === "active";
}

/**
 * Mobile-simplified agent workspace: single-pane master/detail (queue list ↔
 * conversation thread) instead of web's 3-column grid. Visitor profile opens
 * as a full-screen modal via the info button. Team/website supervision
 * (`teamView`, scope filters, agent picker) is a desktop-only power feature
 * and is intentionally left out of the mobile build.
 */
export function ChatOperationsWorkspace() {
  const { user, hasOperational, hasPage, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const inboxAllowed = gates.agentInbox;
  const accessToken = useAccessToken() ?? "";

  const agentChat = useAgentChat({
    token: accessToken,
    agentId: user?.id,
    apiEnabled: inboxAllowed,
  });

  const [queueTab, setQueueTab] = useState<ChatQueueTab>("active");
  const [spamModalOpen, setSpamModalOpen] = useState(false);
  const [spamSubmitBusy, setSpamSubmitBusy] = useState(false);
  const [draftsByConversation, setDraftsByConversation] = useState<Record<string, string>>({});
  const [aiByConversation, setAiByConversation] = useState<Record<string, { messages: AiChatMessage[]; prompt: string; busy: boolean }>>({});
  const [fallbackWebsiteId, setFallbackWebsiteId] = useState("");
  const [availabilityHint, setAvailabilityHint] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [distributionDismissed, setDistributionDismissed] = useState(false);

  useEffect(() => {
    setAgentChatFocusedConversation(agentChat.selectedConversationId);
    return () => setAgentChatFocusedConversation(null);
  }, [agentChat.selectedConversationId]);

  const composer = getConversationDraft(draftsByConversation, agentChat.selectedConversationId);
  const aiState = getConversationAiState(aiByConversation, agentChat.selectedConversationId);
  const { messages: aiMessages, prompt: aiPrompt, busy: aiBusy } = aiState;

  const activeFiltered = agentChat.activeChats;
  const closedFiltered = agentChat.closedChats;
  const { pending: pendingFiltered, completed: completedFiltered, spam: spamFiltered } = useMemo(() => splitEndedChats(closedFiltered), [closedFiltered]);

  const list: ConversationSummary[] =
    queueTab === "active" ? activeFiltered : queueTab === "pending" ? pendingFiltered : queueTab === "completed" ? completedFiltered : spamFiltered;

  const queuePool = [...agentChat.activeChats, ...agentChat.closedChats];
  const selectedSummary = queuePool.find((c) => c.id === agentChat.selectedConversationId) ?? list.find((c) => c.id === agentChat.selectedConversationId);

  const visitorPresentation: AgentVisitorPresentation | null = selectedSummary ? extractVisitorPresentation(selectedSummary) : null;

  const assignedAgentLabel = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email?.trim() || "You";
  const conversationMeta =
    selectedSummary && typeof selectedSummary === "object"
      ? ({ ...(selectedSummary as Record<string, unknown>), agentNameSnapshot: assignedAgentLabel, agentName: assignedAgentLabel } as Record<string, unknown>)
      : null;
  const assignedAgentId = typeof selectedSummary?.assignedAgentId === "string" ? selectedSummary.assignedAgentId : null;
  const websiteIdEffective =
    (typeof selectedSummary?.websiteId === "string" ? selectedSummary.websiteId : "").trim() || agentChat.selectedWebsiteId?.trim() || fallbackWebsiteId.trim() || "";
  const departmentIdEffective =
    (typeof selectedSummary?.departmentId === "string" ? selectedSummary.departmentId : typeof conversationMeta?.departmentId === "string" ? conversationMeta.departmentId : "").trim() || null;

  useEffect(() => {
    if (!inboxAllowed || !accessToken || !websiteIdEffective.trim()) {
      setAvailabilityHint(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await postAgentWebsiteAvailabilityCheck(websiteIdEffective.trim(), accessToken);
        if (cancelled) return;
        if (res == null) {
          setAvailabilityHint(null);
          return;
        }
        const text = typeof res === "string" ? res : res && typeof res === "object" ? JSON.stringify(res) : String(res);
        if (!text.trim() || text === "null") {
          setAvailabilityHint(null);
          return;
        }
        setAvailabilityHint(text.length > 120 ? `${text.slice(0, 120)}…` : text);
      } catch {
        if (!cancelled) setAvailabilityHint(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inboxAllowed, accessToken, websiteIdEffective]);

  const setComposer = useCallback(
    (value: string | ((prev: string) => string)) => {
      const id = agentChat.selectedConversationId;
      if (!id) return;
      setDraftsByConversation((prev) => patchConversationDraft(prev, id, value));
    },
    [agentChat.selectedConversationId],
  );

  const setAiPrompt = useCallback(
    (value: string) => {
      const id = agentChat.selectedConversationId;
      if (!id) return;
      setAiByConversation((prev) => patchConversationAiState(prev, id, { prompt: value }));
    },
    [agentChat.selectedConversationId],
  );

  const pushCannedToComposer = useCallback(
    (line: string) => {
      const id = agentChat.selectedConversationId;
      if (!id) return;
      setDraftsByConversation((prev) => patchConversationDraft(prev, id, (current) => (current ? `${current} ${line}` : line)));
    },
    [agentChat.selectedConversationId],
  );

  const applyAiToComposer = useCallback(
    (text: string) => {
      const id = agentChat.selectedConversationId;
      if (!id) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      setDraftsByConversation((prev) => patchConversationDraft(prev, id, (current) => (current ? `${current}\n\n${trimmed}` : trimmed)));
    },
    [agentChat.selectedConversationId],
  );

  const sendAiPrompt = useCallback(
    async (prompt: string, action: AgentAiAction = "coach_reply") => {
      const conversationId = agentChat.selectedConversationId;
      if (!accessToken || !conversationId) return;
      if (needsWebsite(action) && !websiteIdEffective.trim()) return;

      const userId = `ai-u-${Date.now()}`;
      const pendingId = `ai-a-${Date.now()}`;
      const draftContext = getConversationDraft(draftsByConversation, conversationId).trim();

      setAiByConversation((prev) => {
        const current = getConversationAiState(prev, conversationId);
        return patchConversationAiState(prev, conversationId, {
          prompt: "",
          busy: true,
          messages: [...current.messages, { id: userId, role: "user", content: prompt, action }, { id: pendingId, role: "assistant", content: "", pending: true }],
        });
      });

      try {
        const input = buildAgentCopilotInput({ prompt, action, transcript: agentChat.messages, draftReply: draftContext });
        const data = await postAgentAiSuggestion({
          action,
          input,
          conversationId,
          ...(websiteIdEffective.trim() ? { websiteId: websiteIdEffective.trim() } : {}),
          ...(action === "rewrite_tone" ? { tone: "professional" } : {}),
        });
        const parsed = parseAgentSuggestResponse(data);
        setAiByConversation((prev) => {
          const current = getConversationAiState(prev, conversationId);
          return patchConversationAiState(prev, conversationId, {
            busy: false,
            messages: current.messages.map((m) => (m.id === pendingId ? { ...m, content: parsed.reply, sources: parsed.sources.length ? parsed.sources : undefined, pending: false } : m)),
          });
        });
      } catch (err) {
        const apiMsg = extractApiErrorMessageForToast(err);
        setAiByConversation((prev) => {
          const current = getConversationAiState(prev, conversationId);
          return patchConversationAiState(prev, conversationId, {
            busy: false,
            messages: current.messages.map((m) => (m.id === pendingId ? { ...m, content: apiMsg ?? "Assistant request failed. Try again.", pending: false } : m)),
          });
        });
        if (apiMsg) publishAppToast({ variant: "error", message: apiMsg });
      }
    },
    [accessToken, agentChat.messages, agentChat.selectedConversationId, draftsByConversation, websiteIdEffective],
  );

  const sendNow = async () => {
    const id = agentChat.selectedConversationId;
    if (!id || !composer.trim()) return;
    try {
      await agentChat.sendMessage(composer.trim());
      agentChat.dismissWhisper();
      setDraftsByConversation((prev) => patchConversationDraft(prev, id, ""));
    } catch (err) {
      publishAppToast({ variant: "error", message: extractApiErrorMessageForToast(err) ?? agentChat.sendBlockedReason ?? "Could not send message." });
    }
  };

  const handleSelectConversation = (id: string) => {
    const row = queuePool.find((c) => c.id === id);
    const assigneeAgentId = row?.assignedAgentId ?? (typeof row?.agentId === "string" ? row.agentId : null);
    void agentChat.selectConversation(id, { readOnly: !isLiveQueueTab(queueTab), assigneeAgentId });
  };

  const handleDismissConversation = useCallback(() => {
    agentChat.clearSelection();
  }, [agentChat.clearSelection]);

  const handleConfirmSpam = useCallback(
    async (input: { spamCategory: SpamCategoryValue; notes: string }) => {
      setSpamSubmitBusy(true);
      try {
        await agentChat.markSpamSelectedConversation(input);
        setSpamModalOpen(false);
        setQueueTab("spam");
        publishAppToast({ variant: "success", message: "Chat marked as spam." });
      } catch (err) {
        publishAppToast({ variant: "error", message: extractApiErrorMessageForToast(err, "Could not mark chat as spam.") });
      } finally {
        setSpamSubmitBusy(false);
      }
    },
    [agentChat],
  );

  const canCaptureVisitorProfile = useMemo(() => {
    if (!inboxAllowed || !accessToken || !agentChat.selectedConversationId) return false;
    if (agentChat.selectedIsClosed || Boolean(agentChat.sendBlockedReason)) return false;
    return hasOperational(OP.chat.updateVisitorProfile) || hasChatInboxOperationalFromChecker(hasOperational) || hasPage(PAGE.CHAT_INBOX);
  }, [accessToken, agentChat.selectedConversationId, agentChat.selectedIsClosed, agentChat.sendBlockedReason, hasOperational, hasPage, inboxAllowed]);

  const { captureField } = useVisitorProfileCapture({
    conversationId: agentChat.selectedConversationId,
    token: accessToken,
    enabled: canCaptureVisitorProfile,
    onApplied: (result) => {
      agentChat.applyVisitorProfileUpdate({
        conversationId: result.conversationId,
        visitorId: result.visitorId,
        name: result.name,
        email: result.email,
        phone: result.phone,
        visitorProfileComplete: result.visitorProfileComplete,
        visitorPresentation: result.visitorPresentation,
        displayName: result.visitorPresentation.displayName,
        inboxTitle: result.visitorPresentation.inboxTitle,
        subtitle: result.visitorPresentation.subtitle,
      });
    },
  });

  const [profileCaptureBusy, setProfileCaptureBusy] = useState(false);

  const handleCaptureField = useCallback(
    async (field: VisitorProfileField, value: string, source: { messageId?: string; sourceText?: string }) => {
      setProfileCaptureBusy(true);
      try {
        await captureField(field, value, source);
      } finally {
        setProfileCaptureBusy(false);
      }
    },
    [captureField],
  );

  const sendBlockedHint = agentChat.sendBlockedReason;

  if (permissionsSyncing) {
    return (
      <View style={styles.centerWrap}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!inboxAllowed) {
    return (
      <View style={styles.centerWrap}>
        <PermissionDeniedPanel
          title="Agent inbox not available"
          description="Supervisors and admins use Chat Monitor. Agents and pool heads need chat:bundle:agent or chat:bundle:pool-head on GET /auth/me. Sign out and back in after role changes."
        />
      </View>
    );
  }

  const wrapUpForSelected =
    agentChat.pendingWrapUp && agentChat.selectedConversationId && agentChat.pendingWrapUp.conversationId === agentChat.selectedConversationId ? agentChat.pendingWrapUp : null;

  const selectedCloseBucket = selectedSummary ? resolveClosedChatBucket(selectedSummary) : null;
  const selectedDistributionSubmitted = Boolean(selectedSummary && typeof selectedSummary === "object" && (selectedSummary as Record<string, unknown>).distributionSubmitted);
  const selectedRequiresDistribution =
    selectedCloseBucket === CLOSED_CHAT_BUCKETS.PENDING ||
    Boolean(selectedSummary && typeof selectedSummary === "object" && (selectedSummary as Record<string, unknown>).requiresDistributionForm && !selectedDistributionSubmitted);

  const distributionFormHref = agentChat.selectedConversationId && selectedRequiresDistribution ? buildDistributionFormHref(agentChat.selectedConversationId, wrapUpForSelected?.distributionFormPath) : null;

  const canSend = Boolean(agentChat.selectedConversationId && accessToken) && agentChat.canSendMessage;
  const agentReadOnly = Boolean(agentChat.sendBlockedReason) || agentChat.selectedIsClosed;

  const showThreadPane = Boolean(agentChat.selectedConversationId);
  const showDistributionPrompt = wrapUpForSelected != null && wrapUpForSelected.requiresDistributionForm === true && !wrapUpForSelected.distributionSubmitted && !agentChat.pendingWrapUp?.requiresAgentWrapUp;

  return (
    <View style={styles.root}>
      <AgentChatSessionToolbar showBackToQueue={showThreadPane} onBackToQueue={handleDismissConversation} />

      {!showThreadPane ? (
        <ChatQueueSidebar
          queueTab={queueTab}
          onQueueTabChange={setQueueTab}
          conversations={list}
          selectedConversationId={agentChat.selectedConversationId}
          onSelectConversation={handleSelectConversation}
          activeCount={activeFiltered.length}
          pendingCount={pendingFiltered.length}
          completedCount={completedFiltered.length}
          spamCount={spamFiltered.length}
          connected={agentChat.isConnected}
          hasToken={Boolean(accessToken)}
        />
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>
          <View style={styles.threadHeaderBar}>
            <Button variant="ghost" size="compact" onPress={() => setInfoOpen(true)}>
              Visitor info
            </Button>
          </View>
          <ChatConversationPanel
            conversationId={agentChat.selectedConversationId}
            messages={agentChat.messages}
            visitor={agentChat.visitorFromHistory}
            conversationMeta={conversationMeta}
            visitorPresentation={visitorPresentation}
            readOnly={agentReadOnly}
            assignedAgentLabel={assignedAgentLabel}
            visitorTyping={agentChat.visitorTypingSelected && !agentChat.selectedIsClosed}
            visitorTypingDraft={agentChat.visitorTypingDraft}
            remoteTypingEntries={agentChat.remoteTypingEntries}
            composer={composer}
            onComposerChange={setComposer}
            onSend={() => void sendNow()}
            onTyping={agentChat.emitTyping}
            onStopTyping={agentChat.emitStopTyping}
            onInsertCanned={pushCannedToComposer}
            onDismissConversation={handleDismissConversation}
            showBackButton
            onMarkSpam={agentChat.selectedIsClosed ? undefined : () => setSpamModalOpen(true)}
            canSend={canSend}
            aiMessages={aiMessages}
            aiPrompt={aiPrompt}
            onAiPromptChange={setAiPrompt}
            onSendAiPrompt={(prompt, action) => void sendAiPrompt(prompt, action)}
            onApplyAiToComposer={applyAiToComposer}
            aiBusy={aiBusy}
            websiteRequiredDisabled={!websiteIdEffective.trim()}
            agentInboxEnabled={inboxAllowed}
            copilotEnabled={gates.copilotUse}
            availabilityHint={sendBlockedHint ?? (availabilityHint && websiteIdEffective ? availabilityHint : null)}
            websiteId={websiteIdEffective || null}
            departmentId={departmentIdEffective}
            activeWhisper={agentChat.activeWhisper}
            onApplyWhisperToComposer={pushCannedToComposer}
            onDismissWhisper={agentChat.dismissWhisper}
            distributionFormHref={distributionFormHref}
            requiresDistributionForm={selectedRequiresDistribution}
            distributionSubmitted={selectedDistributionSubmitted}
            hasOperational={hasOperational}
            profileCaptureEnabled={canCaptureVisitorProfile}
            onCaptureField={handleCaptureField}
            profileCaptureBusy={profileCaptureBusy}
          />
        </View>
      )}

      <Modal visible={infoOpen} animationType="slide" onRequestClose={() => setInfoOpen(false)}>
        <View style={styles.infoModal}>
          <View style={styles.infoModalHeader}>
            <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
              Visitor info
            </Typography>
            <Pressable onPress={() => setInfoOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={22} color={tokens.colors.textPrimary} />
            </Pressable>
          </View>
          <VisitorInfoPanel
            visitor={agentChat.visitorFromHistory}
            conversationId={agentChat.selectedConversationId}
            websiteId={websiteIdEffective || null}
            conversationMeta={conversationMeta}
            visitorPresentation={visitorPresentation}
            assignedAgentLabel={assignedAgentLabel}
            assignedAgentId={assignedAgentId}
            currentUserId={user?.id}
            hasOperational={hasOperational}
            supervisorReadOnly={agentChat.selectedIsClosed}
            showWebsiteFallback={Boolean(agentChat.selectedConversationId && !selectedSummary?.websiteId)}
            fallbackWebsiteId={fallbackWebsiteId}
            onFallbackWebsiteIdChange={setFallbackWebsiteId}
            onCloseChat={
              agentChat.selectedConversationId && !agentChat.selectedIsClosed
                ? async () => {
                    await agentChat.closeSelectedConversation();
                    setInfoOpen(false);
                  }
                : undefined
            }
          />
        </View>
      </Modal>

      <MarkSpamModal open={spamModalOpen} busy={spamSubmitBusy} onClose={() => !spamSubmitBusy && setSpamModalOpen(false)} onConfirm={(input) => void handleConfirmSpam(input)} />

      <AgentWrapUpModal
        open={Boolean(wrapUpForSelected?.requiresAgentWrapUp && !wrapUpForSelected.wrapUpSubmitted)}
        payload={wrapUpForSelected}
        onClose={agentChat.dismissWrapUp}
        onSubmitted={agentChat.dismissWrapUp}
      />

      {showDistributionPrompt && wrapUpForSelected && !distributionDismissed ? (
        <AgentDistributionPrompt payload={wrapUpForSelected} onDismiss={() => setDistributionDismissed(true)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#050508",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.lg,
  },
  threadHeaderBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
    backgroundColor: "rgba(8, 10, 20, 0.4)",
  },
  infoModal: {
    flex: 1,
    backgroundColor: tokens.colors.backgroundTop,
  },
  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
});
