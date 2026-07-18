import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { daysUntilDate } from "@/lib/billing/days-until";
import { tokens } from "@/theme/tokens";

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  grace: "Grace period",
  active: "Live",
  suspended: "Suspended",
  cancelled: "Cancelled",
};

function statusColors(status: string) {
  if (status === "active") return { color: tokens.colors.accentGreen, bg: "rgba(34,197,94,0.12)" };
  if (status === "trial") return { color: "#A855F7", bg: "rgba(168,85,247,0.12)" };
  if (status === "grace") return { color: tokens.colors.accentOrange, bg: "rgba(249,115,22,0.12)" };
  if (status === "suspended") return { color: tokens.colors.danger, bg: "rgba(239,68,68,0.12)" };
  return { color: tokens.colors.textMuted, bg: tokens.colors.pillBg };
}

export type WebsiteBillingStatusBadgeProps = {
  status: string;
  trialEndDate?: string | null;
  graceEndDate?: string | null;
};

export function WebsiteBillingStatusBadge({
  status,
  trialEndDate,
  graceEndDate,
}: WebsiteBillingStatusBadgeProps) {
  const normalized = status.trim().toLowerCase();
  const { color, bg } = statusColors(normalized);
  const label = STATUS_LABELS[normalized] ?? status;

  let hint: string | null = null;
  if (normalized === "trial" && trialEndDate) {
    const days = daysUntilDate(trialEndDate);
    hint = days >= 0 ? `${days} day${days === 1 ? "" : "s"} left` : "Trial ended";
  } else if (normalized === "grace" && graceEndDate) {
    const days = daysUntilDate(graceEndDate);
    hint = days >= 0 ? `${days} day${days === 1 ? "" : "s"} until suspend` : "Grace ended";
  }

  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: bg }]}>
        <Typography variant="small" color={color} style={styles.label}>
          {label}
        </Typography>
      </View>
      {hint ? (
        <Typography variant="small" muted>
          {hint}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
  },
  label: { fontWeight: "700", textTransform: "capitalize" },
});
