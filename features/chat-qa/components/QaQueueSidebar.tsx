import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { QaQueueFilters, QaQueueRow } from "@/services/chat/qa.types";
import { formatRelativeQueueTime } from "@/features/chat-operations/utils/format-message-time";
import type { QaStatusTab } from "../hooks/useChatQa";
import { queueRowTitle } from "../utils/qa-labels";
import { chatQaStyles as qaStyles } from "../styles/chat-qa.styles";

const STATUS_TABS: Array<{ id: QaStatusTab; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All" },
];

interface QaQueueSidebarProps {
  statusTab: QaStatusTab;
  onStatusTabChange: (tab: QaStatusTab) => void;
  queue: QaQueueRow[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  loading: boolean;
  filters: QaQueueFilters;
  onFiltersChange: (filters: QaQueueFilters) => void;
  statusCounts: { pending: number; in_progress: number; completed: number; all: number };
}

export function QaQueueSidebar({
  statusTab,
  onStatusTabChange,
  queue,
  selectedConversationId,
  onSelectConversation,
  loading,
  statusCounts,
}: QaQueueSidebarProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((row) => {
      const title = queueRowTitle(row).toLowerCase();
      return title.includes(q) || row.conversationId.toLowerCase().includes(q);
    });
  }, [queue, search]);

  return (
    <View style={qaStyles.queuePane}>
      <View style={qaStyles.queueHeader}>
        <Typography variant="medium" style={{ fontWeight: "700" }}>
          QA queue
        </Typography>
        <View style={qaStyles.tabsRow}>
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.id];
            const active = statusTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => onStatusTabChange(tab.id)}
                style={[qaStyles.tab, active && qaStyles.tabActive]}
              >
                <Typography variant="small" style={{ fontWeight: active ? "700" : "500" }}>
                  {tab.label} ({count})
                </Typography>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search queue…"
          placeholderTextColor={tokens.colors.textMuted}
          style={styles.search}
 />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(row) => row.conversationId}
          ListEmptyComponent={
            <Typography variant="small" muted style={styles.center}>
              No chats in this tab.
            </Typography>
          }
          renderItem={({ item: row }) => {
            const selected = row.conversationId === selectedConversationId;
            const endedAt = row.conversation?.endedAt ?? row.completedAt ?? row.createdAt;
            return (
              <Pressable
                onPress={() => onSelectConversation(row.conversationId)}
                style={[qaStyles.queueRow, selected && qaStyles.queueRowSelected]}
              >
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
                    {queueRowTitle(row)}
                  </Typography>
                  <Typography variant="small" muted numberOfLines={1}>
                    {row.status.replace(/_/g, " ")} · {formatRelativeQueueTime(endedAt)}
                  </Typography>
                </View>
              </Pressable>
            );
          }}
  showsVerticalScrollIndicator={false}/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 8,
    color: tokens.colors.textPrimary,
    backgroundColor: tokens.colors.surface,
  },
  center: { padding: tokens.space.lg, textAlign: "center" },
});
