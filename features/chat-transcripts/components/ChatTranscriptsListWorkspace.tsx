import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useRouter, type Href } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  AppCard,
  Button,
  PermissionDeniedPanel,
  TablePagination,
  Typography,
} from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { useAuth } from "@/lib/auth";
import { needsChatScopeFilters } from "@/lib/permissions";
import { useChatApiGates } from "@/lib/permissions/use-chat-api-gates";
import { PAGE } from "@/lib/permissions/permission-constants";
import { OP } from "@/lib/permissions/operational-keys";
import {
  ChatLivePageHeader,
  ChatLivePageShell,
  calendarDateToIsoEnd,
  calendarDateToIsoStart,
  hasActiveChatScopeFilters,
  useChatScopeFilters,
} from "@/features/chat-shared";
import type { TranscriptListItem } from "@/services/chat/transcript.types";
import type { TranscriptSearchField } from "@/services/chat/transcript.types";
import { agentDisplayName } from "@/services/chat/monitor-normalizers";
import { useChatTranscripts } from "../hooks/useChatTranscripts";
import { useTranscriptSearchSuggestions } from "../hooks/useTranscriptSearchSuggestions";
import { isUuid, type TranscriptSearchKind, type TranscriptSearchSuggestion } from "../types";
import { ChatTranscriptsTableToolbar } from "./ChatTranscriptsTableToolbar";
import { TranscriptStatusChip } from "./TranscriptStatusChip";

function searchKindToField(kind: TranscriptSearchKind): TranscriptSearchField {
  return kind;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export function ChatTranscriptsListWorkspace() {
  const router = useRouter();
  const { hasOperational, hasPage, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const hasPageAccess =
    hasPage(PAGE.CHAT_TRANSCRIPTS) || gates.monitor || hasOperational(OP.qa.chatReview);
  const apiEnabled = gates.ready && hasPageAccess;

  const scopeFilters = useChatScopeFilters(undefined, { apiEnabled });
  const showScopeFilters = needsChatScopeFilters(hasOperational, scopeFilters.canFilterByResellerId);
  const transcripts = useChatTranscripts(null, { apiEnabled });

  const [searchKind, setSearchKind] = useState<TranscriptSearchKind>("agent");
  const [searchInput, setSearchInput] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<TranscriptSearchSuggestion | undefined>();

  const listScope = useMemo(
    () => ({
      resellerId: scopeFilters.filters.resellerId || undefined,
      parentCompanyId: scopeFilters.filters.parentCompanyId || undefined,
      childCompanyId: scopeFilters.filters.childCompanyId || undefined,
      websiteId: scopeFilters.filters.websiteId || undefined,
    }),
    [scopeFilters.filters],
  );

  const { suggestions, isLoading: isSuggestionsLoading } = useTranscriptSearchSuggestions({
    kind: searchKind,
    query: searchInput,
    enabled: apiEnabled,
    listScope,
  });

  useEffect(() => {
    transcripts.patchFilters({
      ...listScope,
      from: calendarDateToIsoStart(scopeFilters.filters.dateFrom) || undefined,
      to: calendarDateToIsoEnd(scopeFilters.filters.dateTo) || undefined,
    });
  }, [listScope, scopeFilters.filters.dateFrom, scopeFilters.filters.dateTo, transcripts.patchFilters]);

  const scopeTenantKey = `${listScope.resellerId ?? ""}|${listScope.parentCompanyId ?? ""}|${listScope.childCompanyId ?? ""}|${listScope.websiteId ?? ""}`;
  const prevScopeTenantKey = useRef(scopeTenantKey);

  useEffect(() => {
    if (prevScopeTenantKey.current === scopeTenantKey) return;
    prevScopeTenantKey.current = scopeTenantKey;
    transcripts.patchFilters({
      agentId: undefined,
      search: undefined,
      searchField: undefined,
      conversationId: undefined,
    });
    setSelectedSuggestion(undefined);
  }, [scopeTenantKey, transcripts.patchFilters]);

  const applyScopeSearch = useCallback(
    (kind: TranscriptSearchKind, suggestion: TranscriptSearchSuggestion) => {
      switch (kind) {
        case "reseller":
          scopeFilters.patchFilters({ resellerId: suggestion.id, parentCompanyId: "", childCompanyId: "", websiteId: "" });
          break;
        case "parentCompany":
          scopeFilters.patchFilters({ parentCompanyId: suggestion.id, childCompanyId: "", websiteId: "" });
          break;
        case "childCompany":
          scopeFilters.patchFilters({ childCompanyId: suggestion.id, websiteId: "" });
          break;
        case "website":
          scopeFilters.patchFilters({ websiteId: suggestion.id });
          break;
        case "agent":
          transcripts.patchFilters({ agentId: suggestion.id, search: undefined, searchField: undefined, conversationId: undefined });
          break;
        case "conversationId":
          transcripts.patchFilters({ conversationId: suggestion.id, search: undefined, searchField: undefined, agentId: undefined });
          break;
        default:
          break;
      }
    },
    [scopeFilters.patchFilters, transcripts.patchFilters],
  );

  const runSearch = useCallback(() => {
    const text = searchInput.trim();
    const baseClear = {
      search: undefined as string | undefined,
      searchField: undefined as TranscriptSearchField | undefined,
      conversationId: undefined as string | undefined,
      agentId: undefined as string | undefined,
    };

    if (selectedSuggestion?.id) {
      applyScopeSearch(searchKind, selectedSuggestion);
      if (searchKind !== "agent" && searchKind !== "conversationId") transcripts.patchFilters(baseClear);
      return;
    }

    if (!text) {
      transcripts.patchFilters(baseClear);
      return;
    }

    switch (searchKind) {
      case "agent":
        transcripts.patchFilters({ ...baseClear, searchField: "agent", search: text });
        break;
      case "conversationId":
        transcripts.patchFilters({
          ...baseClear,
          ...(isUuid(text) ? { conversationId: text } : { searchField: "conversationId", search: text }),
        });
        break;
      default:
        transcripts.patchFilters({ ...baseClear, searchField: searchKindToField(searchKind), search: text });
    }
  }, [applyScopeSearch, searchInput, searchKind, selectedSuggestion, transcripts.patchFilters]);

  const resetAllFilters = useCallback(() => {
    scopeFilters.resetFilters();
    setSearchInput("");
    setSelectedSuggestion(undefined);
    transcripts.patchFilters({
      search: undefined,
      searchField: undefined,
      conversationId: undefined,
      agentId: undefined,
      from: undefined,
      to: undefined,
    });
  }, [scopeFilters.resetFilters, transcripts.patchFilters]);

  const filterPopoverActive = showScopeFilters
    ? hasActiveChatScopeFilters(scopeFilters.filters)
    : Boolean(scopeFilters.filters.dateFrom.trim() || scopeFilters.filters.dateTo.trim());

  if (permissionsSyncing) {
    return (
      <View style={styles.centerWrap}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!hasPageAccess) {
    return (
      <View style={styles.centerWrap}>
        <PermissionDeniedPanel
          title="Chat Transcripts"
          description="Requires page:chat-monitor, page:chat-qa, or chat monitor / QA permissions."
 />
      </View>
    );
  }

  const openDetail = (id: string) => {
    router.push(`/(dashboard)/chat-transcripts/${encodeURIComponent(id)}` as Href);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Chat Transcripts"
          subtitle="Search by reseller, website, agent, or chat ID. Use Filters for tenant scope and date range."
          navPreset="none"
 />

        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="mediumLarge" style={{ fontWeight: "600" }}>
                Conversations
              </Typography>
              <Typography variant="small" muted>
                {transcripts.total} total
              </Typography>
            </View>
          </View>

          <ChatTranscriptsTableToolbar
            searchKind={searchKind}
            onSearchKindChange={setSearchKind}
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            suggestions={suggestions}
            selectedSuggestion={selectedSuggestion}
            onSelectedSuggestionChange={setSelectedSuggestion}
            isSuggestionsLoading={isSuggestionsLoading}
            onSearch={runSearch}
            scopeFilters={scopeFilters.filters}
            onScopePatch={scopeFilters.patchFilters}
            onScopeReset={resetAllFilters}
            canFilterByResellerId={scopeFilters.canFilterByResellerId}
            resellerOptions={scopeFilters.resellerOptions}
            parentCompanyOptions={scopeFilters.parentCompanyOptions}
            childCompanyOptions={scopeFilters.childCompanyOptions}
            websiteOptions={scopeFilters.websiteOptions}
            showScopeFilters={showScopeFilters}
 />

          {transcripts.listQuery.isLoading ? (
            <Typography variant="small" muted style={{ paddingVertical: tokens.space.lg }}>
              Loading transcripts…
            </Typography>
          ) : transcripts.items.length === 0 ? (
            <Typography variant="small" muted style={{ paddingVertical: tokens.space.lg }}>
              {transcripts.listQuery.isError
                ? "Could not load transcripts."
                : filterPopoverActive ||
                    Boolean(transcripts.listFilters.search) ||
                    Boolean(transcripts.listFilters.agentId) ||
                    Boolean(transcripts.listFilters.conversationId)
                  ? "No conversations match your filters."
                  : "No conversations yet."}
            </Typography>
          ) : (
            transcripts.items.map((row) => (
              <TranscriptRow key={row.id} row={row} onPress={() => openDetail(row.id)} />
            ))
          )}

          <View style={styles.footer}>
            <Typography variant="small" muted>
              Page {transcripts.page} of {Math.max(1, transcripts.totalPages)} · {transcripts.total} conversations
            </Typography>
            <TablePagination
              page={transcripts.page}
              pageCount={Math.max(1, transcripts.totalPages)}
              onPageChange={transcripts.setPage}
 />
          </View>
        </AppCard>
      </ChatLivePageShell>
    </ScrollView>
  );
}

function TranscriptRow({ row, onPress }: { row: TranscriptListItem; onPress: () => void }) {
  const visitorName = row.visitorPresentation?.displayName ?? row.visitorPresentation?.inboxTitle ?? "Visitor";
  const agent = row.agent ? agentDisplayName(row.agent) : row.resolvedAgentLabel ?? "—";
  const website = row.website?.name ?? row.website?.url ?? "—";

  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
          {visitorName}
        </Typography>
        <Typography variant="small" muted numberOfLines={1}>
          {website} · {agent}
        </Typography>
        <Typography variant="small" muted>
          {formatDateTime(row.startedAt)} · {row.messageCount} msgs
        </Typography>
      </View>
      <View style={{ alignItems: "flex-end", gap: tokens.space.xs }}>
        <TranscriptStatusChip row={row} />
        <Button variant="secondary" size="compact" onPress={onPress}>
          View
        </Button>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centerWrap: { flex: 1, justifyContent: "center", padding: tokens.space.lg },
  card: { gap: tokens.space.md },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: tokens.space.md },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: tokens.space.md,
    paddingVertical: tokens.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
  footer: {
    gap: tokens.space.sm,
    paddingTop: tokens.space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
});
