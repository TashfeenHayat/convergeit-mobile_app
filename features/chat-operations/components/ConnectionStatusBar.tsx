import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

interface ConnectionStatusBarProps {
  connected: boolean;
  hasToken: boolean;
  /** Sidebar: pill only. Default: pill + caption. */
  compact?: boolean;
}

export function ConnectionStatusBar({ connected, hasToken, compact = false }: ConnectionStatusBarProps) {
  if (!hasToken) {
    return (
      <Typography variant="small" color={tokens.colors.danger}>
        No session
      </Typography>
    );
  }

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: compact ? 0 : 8 }}>
      <View style={[styles.pill, connected ? styles.pillConnected : styles.pillOffline]}>
        <View style={[styles.dot, { backgroundColor: connected ? tokens.colors.accentGreen : tokens.colors.danger }]} />
        <Typography variant="small" style={{ fontWeight: "600" }}>
          {connected ? "Live" : "Offline"}
        </Typography>
      </View>
      {!compact ? (
        <Typography variant="small" muted>
          {connected ? "Realtime on" : "Reconnecting…"}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillConnected: {
    borderColor: "rgba(34, 197, 94, 0.35)",
    backgroundColor: "rgba(34, 197, 94, 0.12)",
  },
  pillOffline: {
    borderColor: "rgba(239, 68, 68, 0.35)",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
