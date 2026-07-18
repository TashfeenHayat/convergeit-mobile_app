import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
};

function statusColors(status: string) {
  if (status === "paid") return { color: tokens.colors.accentGreen, bg: "rgba(34,197,94,0.12)" };
  if (status === "overdue") return { color: tokens.colors.danger, bg: "rgba(239,68,68,0.12)" };
  if (status === "pending") return { color: tokens.colors.accentOrange, bg: "rgba(249,115,22,0.12)" };
  return { color: tokens.colors.textMuted, bg: tokens.colors.pillBg };
}

export type InvoiceStatusBadgeProps = { status: string };

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const normalized = status.trim().toLowerCase();
  const { color, bg } = statusColors(normalized);

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: `${color}59` }]}>
      <Typography variant="small" color={color} style={styles.label}>
        {STATUS_LABELS[normalized] ?? status}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  label: { fontWeight: "700", textTransform: "capitalize" },
});
