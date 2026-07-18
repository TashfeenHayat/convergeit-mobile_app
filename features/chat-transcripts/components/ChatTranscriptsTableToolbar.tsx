import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  FilterableSearchBar,
  InputField,
  Typography,
} from "@/components/ui";
import { tokens } from "@/theme/tokens";
import {
  ChatScopeFilterPopoverPanel,
  hasActiveChatScopeFilters,
  type ChatScopeFilterState,
} from "@/features/chat-shared";
import {
  TRANSCRIPT_SEARCH_KIND_OPTIONS,
  type TranscriptSearchKind,
  type TranscriptSearchSuggestion,
} from "../types";

type Props = {
  searchKind: TranscriptSearchKind;
  onSearchKindChange: (kind: TranscriptSearchKind) => void;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  suggestions: TranscriptSearchSuggestion[];
  selectedSuggestion?: TranscriptSearchSuggestion;
  onSelectedSuggestionChange: (value: TranscriptSearchSuggestion | undefined) => void;
  isSuggestionsLoading: boolean;
  onSearch: () => void;
  scopeFilters: ChatScopeFilterState;
  onScopePatch: (patch: Partial<ChatScopeFilterState>) => void;
  onScopeReset: () => void;
  canFilterByResellerId: boolean;
  resellerOptions: Array<{ value: string; label: string }>;
  parentCompanyOptions: Array<{ value: string; label: string }>;
  childCompanyOptions: Array<{ value: string; label: string }>;
  websiteOptions: Array<{ value: string; label: string }>;
  showScopeFilters: boolean;
};

const SEARCH_PLACEHOLDER: Record<TranscriptSearchKind, string> = {
  reseller: "Type reseller name…",
  parentCompany: "Type parent company name…",
  childCompany: "Type child company name…",
  website: "Type website name or URL…",
  agent: "Type agent name…",
  conversationId: "Type visitor name or chat ID…",
};

export function ChatTranscriptsTableToolbar({
  searchKind,
  onSearchKindChange,
  searchInput,
  onSearchInputChange,
  suggestions,
  selectedSuggestion,
  onSelectedSuggestionChange,
  isSuggestionsLoading,
  onSearch,
  scopeFilters,
  onScopePatch,
  onScopeReset,
  canFilterByResellerId,
  resellerOptions,
  parentCompanyOptions,
  childCompanyOptions,
  websiteOptions,
  showScopeFilters,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);

  const scopeActive = hasActiveChatScopeFilters(scopeFilters);
  const dateOnlyActive = Boolean(scopeFilters.dateFrom.trim() || scopeFilters.dateTo.trim());

  const kindOptions = useMemo(
    () => TRANSCRIPT_SEARCH_KIND_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  return (
    <View style={styles.root}>
      <FilterableSearchBar
        value={searchInput}
        onChange={(text) => {
          onSearchInputChange(text);
          if (!text.trim()) onSelectedSuggestionChange(undefined);
        }}
        selectValue={searchKind}
        onSelectChange={(v) => {
          onSearchKindChange(v as TranscriptSearchKind);
          onSelectedSuggestionChange(undefined);
        }}
        selectOptions={kindOptions}
        selectedSuggestion={selectedSuggestion}
        onSelectedSuggestionChange={onSelectedSuggestionChange}
        suggestions={suggestions}
        isSuggestionsLoading={isSuggestionsLoading}
        placeholder={SEARCH_PLACEHOLDER[searchKind]}
        onEnter={onSearch}
      />
      <View style={styles.actionsRow}>
        <Button variant="primary" size="compact" onPress={onSearch}>
          Search
        </Button>
        <Button variant="secondary" size="compact" onPress={() => setFilterOpen(true)}>
          {`Filters${scopeActive || dateOnlyActive ? " •" : ""}`}
        </Button>
      </View>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Typography variant="mediumLarge" style={{ fontWeight: "700", marginBottom: tokens.space.sm }}>
                Transcript filters
              </Typography>
              {showScopeFilters ? (
                <ChatScopeFilterPopoverPanel
                  filters={scopeFilters}
                  onPatch={onScopePatch}
                  onReset={() => onScopePatch({ dateFrom: "", dateTo: "" })}
                  canFilterByResellerId={canFilterByResellerId}
                  resellerOptions={resellerOptions}
                  parentCompanyOptions={parentCompanyOptions}
                  childCompanyOptions={childCompanyOptions}
                  websiteOptions={websiteOptions}
                  hasActiveFilters={scopeActive}
                  onClose={() => setFilterOpen(false)}
                  title="Scope filters"
                />
              ) : null}
              <InputField
                label="Date from (YYYY-MM-DD)"
                value={scopeFilters.dateFrom}
                onChangeText={(v) => onScopePatch({ dateFrom: v })}
                placeholder="2026-01-01"
                autoCapitalize="none"
              />
              <InputField
                label="Date to (YYYY-MM-DD)"
                value={scopeFilters.dateTo}
                onChangeText={(v) => onScopePatch({ dateTo: v })}
                placeholder="2026-01-31"
                autoCapitalize="none"
              />
              <View style={styles.modalFooter}>
                <Button
                  variant="secondary"
                  onPress={() => {
                    onScopeReset();
                    setFilterOpen(false);
                  }}
                >
                  Reset all
                </Button>
                <Button variant="primary" onPress={() => setFilterOpen(false)}>
                  Done
                </Button>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.space.sm,
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "85%",
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space.lg,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: tokens.space.sm,
    marginTop: tokens.space.lg,
  },
});
