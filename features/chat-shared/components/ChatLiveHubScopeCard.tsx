import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppCard, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatScopeFilterPopoverPanel } from "./ChatScopeFilterPopoverPanel";
import { hasActiveChatScopeFilters } from "../utils/chat-scope-filters-active";
import type { ChatScopeFilterState } from "../types";

type ChatLiveHubScopeCardProps = {
  filters: ChatScopeFilterState;
  onPatch: (patch: Partial<ChatScopeFilterState>) => void;
  onReset: () => void;
  canFilterByResellerId: boolean;
  resellerOptions: { value: string; label: string }[];
  parentCompanyOptions: { value: string; label: string }[];
  childCompanyOptions: { value: string; label: string }[];
  websiteOptions: { value: string; label: string }[];
  showDepartmentPool?: boolean;
  departmentOptions?: { value: string; label: string }[];
  poolOptions?: { value: string; label: string }[];
  statusOptions?: { value: string; label: string }[];
  agentSearch: string;
  onAgentSearchChange: (v: string) => void;
};

export function ChatLiveHubScopeCard({
  filters,
  onPatch,
  onReset,
  canFilterByResellerId,
  resellerOptions,
  parentCompanyOptions,
  childCompanyOptions,
  websiteOptions,
  showDepartmentPool = true,
  departmentOptions = [],
  poolOptions = [],
  statusOptions = [],
  agentSearch,
  onAgentSearchChange,
}: ChatLiveHubScopeCardProps) {
  const [filterOpen, setFilterOpen] = useState(false);

  const hasActive = useMemo(
    () => hasActiveChatScopeFilters(filters) || Boolean(agentSearch.trim()),
    [agentSearch, filters],
  );

  return (
    <AppCard style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.iconBox}>
          <FontAwesome name="filter" size={18} color={tokens.colors.accentBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Typography variant="label" style={{ fontWeight: "600" }}>
            Scope
          </Typography>
          <Typography variant="small" muted>
            Select a website to list assigned agents, then open their chats.
          </Typography>
        </View>
      </View>

      <View style={styles.searchRow}>
        <InputField
          value={agentSearch}
          onChangeText={onAgentSearchChange}
          placeholder="Search agent name or email…"
          containerStyle={{ flex: 1 }}
        />
        <Pressable
          onPress={() => setFilterOpen(true)}
          style={[styles.filterBtn, hasActive && styles.filterBtnActive]}
          accessibilityRole="button"
        >
          <FontAwesome name="sliders" size={14} color={hasActive ? tokens.colors.accentBlue : tokens.colors.textMuted} />
        </Pressable>
      </View>

      <Modal visible={filterOpen} animationType="slide" transparent onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <ChatScopeFilterPopoverPanel
            filters={filters}
            onPatch={onPatch}
            onReset={onReset}
            canFilterByResellerId={canFilterByResellerId}
            resellerOptions={resellerOptions}
            parentCompanyOptions={parentCompanyOptions}
            childCompanyOptions={childCompanyOptions}
            websiteOptions={websiteOptions}
            showDepartment={showDepartmentPool}
            showPool={showDepartmentPool}
            showStatus={statusOptions.length > 1}
            departmentOptions={departmentOptions}
            poolOptions={poolOptions}
            statusOptions={statusOptions}
            hasActiveFilters={hasActive}
            onClose={() => setFilterOpen(false)}
            title="Scope filters"
            hint="Reseller → company → website. Department and pool narrow the agent list and chat queue."
          />
        </View>
      </Modal>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: tokens.space.sm,
    marginBottom: tokens.space.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 101, 242, 0.12)",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  filterBtnActive: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: "rgba(88, 101, 242, 0.1)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    maxHeight: "80%",
  },
});
