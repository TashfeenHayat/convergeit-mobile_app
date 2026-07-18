import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { PaymentSetupTone } from "@/lib/billing/stripe-setup-status";

export type StripeStatusBadgeProps = {
  label: string;
  ok: boolean;
  tone?: PaymentSetupTone;
};

export function StripeStatusBadge({ label, ok, tone }: StripeStatusBadgeProps) {
  const resolvedTone: PaymentSetupTone = tone ?? (ok ? "success" : "warning");
  const color = resolvedTone === "success" ? tokens.colors.accentGreen : tokens.colors.accentOrange;
  const bg = resolvedTone === "success" ? "rgba(34,197,94,0.12)" : "rgba(249,115,22,0.12)";

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: `${color}47` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Typography variant="small" color={color} style={styles.label}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { fontWeight: "700" },
});
