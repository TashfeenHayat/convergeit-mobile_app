import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { WidgetAdminMeta } from "@/lib/chat-widget/widget-admin-meta";

export function WidgetDeployStatusCard({ meta }: { meta: WidgetAdminMeta | null }) {
  if (!meta) {
    return (
      <Typography variant="small" muted>
        No deploy metadata.
      </Typography>
    );
  }

  const rows = [
    { label: "State", value: meta.deploy.state },
    { label: "Live at", value: meta.deploy.liveAt ? new Date(meta.deploy.liveAt).toLocaleString() : "—" },
    { label: "Draft saved", value: meta.deploy.draftSavedAt ? new Date(meta.deploy.draftSavedAt).toLocaleString() : "—" },
    { label: "Website ID", value: meta.websiteId ?? "—" },
  ];

  return (
    <View style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Typography variant="small" muted style={{ width: 100 }}>
            {row.label}
          </Typography>
          <Typography variant="small" style={{ flex: 1 }}>
            {String(row.value)}
          </Typography>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: tokens.space.xs,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.pillBg,
  },
  row: { flexDirection: "row", gap: tokens.space.sm },
});
