import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

type ChatOpsTeamHubSectionProps = {
  open: boolean;
  onToggle: () => void;
  websiteLabel?: string | null;
  websiteSelected: boolean;
  teamAgentName?: string | null;
  agentCount?: number;
  onClearAgent?: () => void;
  children: ReactNode;
};

export function ChatOpsTeamHubSection({
  open,
  onToggle,
  websiteLabel,
  websiteSelected,
  teamAgentName,
  agentCount,
  onClearAgent,
  children,
}: ChatOpsTeamHubSectionProps) {
  const summaryParts = [
    websiteSelected && websiteLabel ? websiteLabel : websiteSelected ? "Website selected" : null,
    teamAgentName ? teamAgentName : agentCount != null && websiteSelected ? `${agentCount} agents` : null,
  ].filter(Boolean) as string[];

  return (
    <View>
      <View style={styles.controlBar}>
        <Pressable onPress={onToggle} style={styles.toggleButton} accessibilityRole="button" accessibilityState={{ expanded: open }}>
          <Ionicons name="people-circle-outline" size={17} color={tokens.colors.textPrimary} />
          <Typography variant="small" style={{ fontWeight: "600" }}>
            {open ? "Hide agent picker" : "Show agent picker"}
          </Typography>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={tokens.colors.textMuted} />
        </Pressable>

        {!open ? (
          <View style={styles.summaryRow}>
            {summaryParts.length === 0 ? (
              <Typography variant="small" muted style={{ fontSize: 12 }}>
                Pick a website and agent to supervise chats
              </Typography>
            ) : (
              <>
                {websiteSelected && websiteLabel ? (
                  <View style={styles.chip}>
                    <Ionicons name="globe-outline" size={12} color={tokens.colors.textPrimary} />
                    <Typography variant="small" style={{ fontSize: 11 }} numberOfLines={1}>
                      {websiteLabel}
                    </Typography>
                  </View>
                ) : null}
                {teamAgentName ? (
                  <Pressable style={styles.chip} onPress={onClearAgent} disabled={!onClearAgent}>
                    <Ionicons name="person-outline" size={12} color={tokens.colors.textPrimary} />
                    <Typography variant="small" style={{ fontSize: 11 }} numberOfLines={1}>
                      {teamAgentName}
                    </Typography>
                    {onClearAgent ? <Ionicons name="close" size={12} color={tokens.colors.textMuted} /> : null}
                  </Pressable>
                ) : agentCount != null && websiteSelected ? (
                  <View style={styles.chip}>
                    <Ionicons name="people-outline" size={12} color={tokens.colors.textPrimary} />
                    <Typography variant="small" style={{ fontSize: 11 }}>
                      {agentCount} agents
                    </Typography>
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>

      {open ? <View style={styles.panelBody}>{children}</View> : null}

      {!open ? <View style={styles.divider} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  controlBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 8,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.pillBg,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: 160,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  panelBody: {
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.sm,
  },
  divider: {
    height: 1,
    marginHorizontal: tokens.space.md,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
