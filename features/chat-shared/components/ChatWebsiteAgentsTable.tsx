import { FlatList, Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { ListTableCard, StatusChip, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatWebsiteAgentRow } from "../utils/flatten-website-agents";

type ChatWebsiteAgentsTableProps = {
  rows: ChatWebsiteAgentRow[];
  isLoading: boolean;
  isError: boolean;
  selectedAgentUserId?: string | null;
  onSelectAgent: (row: ChatWebsiteAgentRow) => void;
  websiteLabel?: string;
};

/** Mobile-first agent roster list (web used a dense `DataTable`). */
export function ChatWebsiteAgentsTable({
  rows,
  isLoading,
  isError,
  selectedAgentUserId,
  onSelectAgent,
  websiteLabel,
}: ChatWebsiteAgentsTableProps) {
  return (
    <ListTableCard
      title="Assigned agents"
      subtitle={
        websiteLabel
          ? `${websiteLabel} · ${isLoading ? "Loading…" : `${rows.length} agent${rows.length === 1 ? "" : "s"}`}`
          : isLoading
            ? "Loading roster…"
            : `${rows.length} agent${rows.length === 1 ? "" : "s"} · tap to open chats`
      }
      icon="people-outline"
    >
      <FlatList
        data={rows}
        keyExtractor={(row) => row.rowKey}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const active = item.userId === selectedAgentUserId;
          return (
            <Pressable
              onPress={() => onSelectAgent(item)}
              style={[styles.row, active && styles.rowActive]}
              accessibilityRole="button"
              accessibilityLabel={`Open chats for ${item.displayName}`}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="medium" style={{ fontWeight: "600" }} numberOfLines={1}>
                  {item.displayName}
                </Typography>
                {item.email ? (
                  <Typography variant="small" muted numberOfLines={1}>
                    {item.email}
                  </Typography>
                ) : null}
                <View style={styles.metaRow}>
                  <StatusChip label={item.serviceChannel} tone="info" />
                  <Typography variant="small" muted numberOfLines={1} style={{ flex: 1 }}>
                    {item.departmentName || "—"} · {item.assignmentTier}
                  </Typography>
                </View>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Typography
                  variant="label"
                  style={{ fontWeight: item.liveCount > 0 ? "700" : "400" }}
                  color={item.liveCount > 0 ? tokens.colors.accentBlue : tokens.colors.textMuted}
                >
                  {item.liveCount}
                </Typography>
                <FontAwesome name="chevron-right" size={13} color={tokens.colors.textMuted} />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Typography variant="medium" style={{ fontWeight: "600" }}>
              {isError ? "Could not load agents" : "No agents on this website"}
            </Typography>
            <Typography variant="small" muted style={{ marginTop: 4, textAlign: "center" }}>
              {isError
                ? "Check website assignment and monitor permissions."
                : "Assign agents on Website assignments, then pick them here to monitor or coach."}
            </Typography>
          </View>
        }
      />
    </ListTableCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    padding: tokens.space.md,
  },
  rowActive: {
    backgroundColor: "rgba(88, 101, 242, 0.08)",
    borderRadius: tokens.radius.md,
  },
  separator: {
    height: 1,
    backgroundColor: tokens.colors.cardBorder,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  empty: {
    padding: tokens.space.xl,
    alignItems: "center",
  },
});
