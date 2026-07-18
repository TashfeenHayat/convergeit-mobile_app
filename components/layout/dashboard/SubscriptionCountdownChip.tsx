import { Pressable, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";

import { Typography } from "@/components/ui";
import { webHrefToMobile } from "@/constants/navigation";
import { useAuth } from "@/lib/auth";
import { useMyResellerSubscriptionQuery } from "@/lib/hooks/query/billing/billing";
import { tokens } from "@/theme/tokens";

export function SubscriptionCountdownChip() {
  const router = useRouter();
  const { user, isPlatformAdmin } = useAuth();
  const wideResellerScope = (user as { wideResellerScope?: boolean } | null)?.wideResellerScope === true;
  const isResellerAdmin = wideResellerScope && !isPlatformAdmin;

  const subscriptionQuery = useMyResellerSubscriptionQuery({
    enabled: isResellerAdmin,
    refetchInterval: 60_000,
  });

  if (!isResellerAdmin) return null;

  const sub = subscriptionQuery.data?.data;
  const paymentPending = Boolean(sub?.paymentPending ?? sub?.showCountdown ?? sub?.isExpired);
  if (!sub || !paymentPending) return null;

  const urgent = Boolean(sub.isExpired || sub.daysRemaining <= 1);
  const label = sub.isExpired ? "Payment pending" : `${sub.daysRemaining}d left`;

  return (
    <Pressable
      onPress={() => router.push(webHrefToMobile("/dashboard/billing") as Href)}
      style={[styles.chip, urgent ? styles.urgent : styles.warn]}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Typography variant="small" style={styles.label}>
        {label}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warn: {
    backgroundColor: "rgba(255,193,7,0.2)",
    borderColor: "rgba(255,193,7,0.45)",
  },
  urgent: {
    backgroundColor: "rgba(248,113,113,0.25)",
    borderColor: "rgba(248,113,113,0.55)",
  },
  label: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 11,
  },
});
