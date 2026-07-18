import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import { Button, PermissionDeniedPanel, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import {
  canAnnotateQaMessage,
  canAssignQaReview,
  canReviewQaSession,
} from "@/lib/permissions";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import {
  ChatLivePageHeader,
  ChatLivePageShell,
  ChatScopeFiltersPanel,
  qaRowMatchesScope,
  useChatScopeFilters,
} from "@/features/chat-shared";
import { useQaRosterQuery } from "@/features/chat-settings/hooks/useChatSettings";
import { useChatQa } from "../hooks/useChatQa";
import { QaQueueSidebar } from "./QaQueueSidebar";
import { QaAnnotatedTranscript } from "./QaAnnotatedTranscript";
import { QaSessionReviewPanel } from "./QaSessionReviewPanel";
import { QaSessionContextPanel } from "./QaSessionContextPanel";
import { chatQaStyles } from "../styles/chat-qa.styles";

export function ChatQaWorkspace({ initialConversationId = null }: { initialConversationId?: string | null }) {
  const router = useRouter();
  const { hasOperational, permissionsSyncing, user } = useAuth();
  const gates = useChatApiGates();
  const allowed = gates.qa;
  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled: allowed });
  const qa = useChatQa(initialConversationId, { apiEnabled: allowed });

  useEffect(() => {
    qa.setFilters((prev) => ({
      ...prev,
      websiteId: scopeFilters.filters.websiteId.trim() || undefined,
    }));
  }, [scopeFilters.filters.websiteId, qa.setFilters]);

  const scopedQueue = useMemo(
    () => qa.queue.filter((row) => qaRowMatchesScope(row, scopeFilters.filters, scopeFilters.websiteIdsInScope)),
    [qa.queue, scopeFilters.filters, scopeFilters.websiteIdsInScope],
  );

  const rosterWebsiteId = useMemo(() => {
    const fromReview = qa.bundle?.review?.websiteId?.trim();
    if (fromReview) return fromReview;
    const row = qa.queue.find((r) => r.conversationId === qa.selectedConversationId);
    if (row?.websiteId?.trim()) return row.websiteId.trim();
    const transcript = qa.bundle?.transcript as { websiteId?: string } | undefined;
    return transcript?.websiteId?.trim() ?? "";
  }, [qa.bundle, qa.queue, qa.selectedConversationId]);

  const rosterQuery = useQaRosterQuery(rosterWebsiteId, Boolean(rosterWebsiteId) && canAssignQaReview(hasOperational));

  const rosterAssignOptions = useMemo(() => {
    const channel = String(qa.bundle?.review?.serviceChannel ?? qa.bundle?.transcript?.serviceChannel ?? "internal").toLowerCase();
    const list = channel === "external" ? rosterQuery.data?.external : rosterQuery.data?.internal;
    return (list ?? []).map((r) => ({
      id: r.userId,
      label: [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ").trim() || r.user?.email || r.userId.slice(0, 8),
    }));
  }, [qa.bundle, rosterQuery.data]);

  const handleSelect = (id: string) => {
    qa.selectConversation(id);
    router.setParams({ conversationId: id });
  };

  const clearSelection = () => {
    qa.selectConversation(null);
    router.setParams({ conversationId: undefined });
  };

  const showThread = Boolean(qa.selectedConversationId);

  if (permissionsSyncing) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={styles.center}>
        <PermissionDeniedPanel
          title="QA inbox not available"
          description="Requires page:chat-qa and qa:chat:review (or related QA codes) from /auth/me."
        />
      </View>
    );
  }

  if (!qa.token) {
    return (
      <View style={styles.center}>
        <Typography variant="medium" muted>
          Sign in to open the QA inbox.
        </Typography>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ChatLivePageShell variant="workstation">
        <ChatLivePageHeader
          title="QA Inbox"
          subtitle="Closed chats land in your queue. Read the transcript, score the session, then submit the QA report."
          navPreset="triage"
        />

        <View style={chatQaStyles.statsRow}>
          <Typography variant="small" style={chatQaStyles.statPill}>
            Pending {qa.statusCounts.pending}
          </Typography>
          <Typography variant="small" style={chatQaStyles.statPill}>
            In progress {qa.statusCounts.in_progress}
          </Typography>
          <Typography variant="small" style={chatQaStyles.statPill}>
            Done {qa.statusCounts.completed}
          </Typography>
        </View>

        <View style={styles.scopeCard}>
          <ChatScopeFiltersPanel
            compact
            filters={scopeFilters.filters}
            onPatch={scopeFilters.patchFilters}
            onReset={scopeFilters.resetFilters}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
            hint="Filter reviews by organization and website."
          />
        </View>

        {qa.queueError ? (
          <View style={styles.errorRow}>
            <Typography variant="small" style={{ color: tokens.colors.danger }}>
              Could not load QA queue.
            </Typography>
            <Button variant="secondary" size="compact" onPress={() => void qa.refreshQueue()}>
              Retry
            </Button>
          </View>
        ) : null}

        {!showThread ? (
          <QaQueueSidebar
            statusTab={qa.statusTab}
            onStatusTabChange={qa.setStatusTab}
            queue={scopedQueue}
            selectedConversationId={qa.selectedConversationId}
            onSelectConversation={handleSelect}
            loading={qa.queueLoading}
            filters={qa.filters}
            onFiltersChange={qa.setFilters}
            statusCounts={qa.statusCounts}
          />
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
            <Pressable onPress={clearSelection} style={styles.backRow}>
              <Typography variant="medium">← Back to queue</Typography>
            </Pressable>
            <QaAnnotatedTranscript
              bundle={qa.bundle}
              messages={qa.messages}
              visitor={qa.visitorFromHistory}
              loading={qa.bundleLoading}
              canAnnotate={canAnnotateQaMessage(hasOperational)}
              annotationsByMessageId={qa.annotationsByMessageId}
              onSaveAnnotation={qa.saveMessageAnnotation}
              saving={qa.bundleLoading}
            />
            <QaSessionReviewPanel
              bundle={qa.bundle}
              canEdit={canReviewQaSession(hasOperational)}
              canAssign={canAssignQaReview(hasOperational)}
              currentUserId={user?.id ?? null}
              rosterAssignOptions={rosterAssignOptions}
              onSave={qa.saveSessionReview}
              onClaim={qa.claimReview}
              onAssignTo={qa.assignReviewTo}
              saving={qa.bundleLoading}
            />
            <QaSessionContextPanel bundle={qa.bundle} />
          </ScrollView>
        )}
      </ChatLivePageShell>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  scopeCard: {
    marginBottom: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    padding: tokens.space.md,
  },
  backRow: { padding: tokens.space.md },
});
