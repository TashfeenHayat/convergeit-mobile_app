import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { getInboxRowLabels } from "@/services/chat/visitor-presentation";
import { agentDisplayName } from "@/services/chat/monitor-normalizers";
import type { MonitorConversationRow, MonitorListTab } from "@/services/chat/monitor.types";
import { getConversationPreview } from "@/features/chat-operations/utils/conversation-preview";
import { formatRelativeQueueTime } from "@/features/chat-operations/utils/format-message-time";
import { ConnectionStatusBar } from "@/features/chat-operations/components/ConnectionStatusBar";

interface MonitorQueueSidebarProps {
  listTab: MonitorListTab;
  onListTabChange: (tab: MonitorListTab) => void;
  conversations: MonitorConversationRow[];
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
  liveCount: number;
  closedCount: number;
  connected: boolean;
  hasToken: boolean;
  loading: boolean;
  agentLabel?: string | null;
}

function statusChipColors(status: string): { bg: string; color: string } {
  if (status === "waiting") return { bg: "rgba(249,115,22,0.16)", color: tokens.colors.accentOrange };
  if (status === "offline" || status === "closed") return { bg: "rgba(148,163,184,0.16)", color: tokens.colors.textMuted };
  return { bg: "rgba(88,101,242,0.16)", color: tokens.colors.accentBlue };
}

export function MonitorQueueSidebar({
  listTab,
  onListTabChange,
  conversations,
  selectedConversationId,
  onSelectConversation,
  liveCount,
  closedCount,
  connected,
  hasToken,
  loading,
  agentLabel = null,
}: MonitorQueueSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const { title, subtitle } = getInboxRowLabels(c);
      const agent = agentDisplayName(c.agent).toLowerCase();
      return [title, subtitle ?? "", agent, c.status, c.id].join(" ").toLowerCase().includes(q);
    });
  }, [conversations, searchQuery]);

  return (
    <View style={styles.column}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <Typography variant="label" style={{ fontWeight: "700" }} numberOfLines={1}>
            {agentLabel ? `Monitoring · ${agentLabel}` : "Monitor queue"}
          </Typography>
          <Typography variant="small" muted numberOfLines={1}>
            {agentLabel ? "Live and closed chats for this agent" : "Scoped by your monitor role"}
          </Typography>
        </View>
        <ConnectionStatusBar connected={connected} hasToken={hasToken} compact />
      </View>

      <View style={styles.header}>
        <View style={styles.tabsRow}>
          <Pressable onPress={() => onListTabChange("live")} style={[styles.tab, listTab === "live" && styles.tabActive]}>
            <Typography variant="small" color={listTab === "live" ? tokens.colors.textPrimary : tokens.colors.textMuted} style={{ fontWeight: listTab === "live" ? "700" : "500" }}>
              Live · {liveCount}
            </Typography>
          </Pressable>
          <Pressable onPress={() => onListTabChange("closed")} style={[styles.tab, listTab === "closed" && styles.tabActive]}>
            <Typography variant="small" color={listTab === "closed" ? tokens.colors.textPrimary : tokens.colors.textMuted} style={{ fontWeight: listTab === "closed" ? "700" : "500" }}>
              Closed · {closedCount}
            </Typography>
          </Pressable>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <FontAwesome name="search" size={13} color={tokens.colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, site, or ID…"
          placeholderTextColor={tokens.colors.textPlaceholder}
          style={styles.searchInput}
 />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingVertical: tokens.space.sm, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography variant="medium" muted>
              {loading ? "Loading…" : searchQuery.trim() ? "No results" : "No conversations in this queue"}
            </Typography>
          </View>
        }
        renderItem={({ item: conversation }) => {
          const { title, subtitle, initials } = getInboxRowLabels(conversation);
          const selected = conversation.id === selectedConversationId;
          const preview = getConversationPreview(
            conversation as unknown as import("@/services/chat/chat.types").ConversationSummary,
            listTab === "closed" ? "Closed" : "No messages yet",
          );
          const chip = statusChipColors(conversation.status);
          const time = formatRelativeQueueTime(conversation.startedAt);

          return (
            <Pressable onPress={() => onSelectConversation(conversation.id)} style={[styles.row, selected && styles.rowActive]}>
              <View style={styles.avatar}>
                <Typography variant="small" style={{ fontWeight: "700" }}>
                  {initials}
                </Typography>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 6 }}>
                  <Typography variant="medium" style={{ fontWeight: selected ? "700" : "600", flex: 1 }} numberOfLines={1}>
                    {title}
                  </Typography>
                  {time ? (
                    <Typography variant="small" muted>
                      {time}
                    </Typography>
                  ) : null}
                </View>
                {subtitle ? (
                  <Typography variant="small" muted numberOfLines={1}>
                    {subtitle}
                  </Typography>
                ) : null}
                <View style={styles.metaRow}>
                  <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
                    <Typography variant="small" color={chip.color} style={{ fontSize: 10, fontWeight: "700" }}>
                      {conversation.status}
                    </Typography>
                  </View>
                  <Typography variant="small" muted style={{ fontSize: 10 }} numberOfLines={1}>
                    {agentDisplayName(conversation.agent)}
                  </Typography>
                </View>
                <Typography variant="small" muted numberOfLines={1} style={{ marginTop: 2 }}>
                  {preview}
                </Typography>
              </View>
            </Pressable>
          );
        }}
  showsVerticalScrollIndicator={false}/>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, minHeight: 0 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  header: {
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.sm,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 6, alignItems: "center" },
  tabActive: { backgroundColor: "rgba(88, 101, 242, 0.22)" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  searchInput: { flex: 1, color: tokens.colors.textPrimary, fontSize: 13 },
  empty: { paddingVertical: 48, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
  },
  rowActive: { backgroundColor: "rgba(88, 101, 242, 0.1)" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  statusChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
