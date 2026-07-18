import { Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter, type Href } from "expo-router";

import { Typography } from "@/components/ui";
import { webHrefToMobile } from "@/constants/navigation";
import { useAuth } from "@/lib/auth";
import { useMyResellerSubscriptionQuery } from "@/lib/hooks/query/billing/billing";
import { tokens } from "@/theme/tokens";

export function SubscriptionCountdownBanner() {
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

  return (
    <View
      style={[styles.banner, urgent ? styles.urgent : styles.warn]}
      accessibilityRole="summary"
    >
      <View style={styles.copy}>
        <FontAwesome name="clock-o" size={18} color={urgent ? "#f87171" : "#ffc107"} />
        <Typography variant="small" style={styles.text}>
          {sub.isExpired
            ? `Payment pending — plan ${sub.planName} has expired. Pay to renew.`
            : `Payment pending — plan ${sub.planName} ends ${sub.endDate} — ${sub.daysRemaining} day${
                sub.daysRemaining === 1 ? "" : "s"
              } left`}
        </Typography>
      </View>
      <Pressable
        onPress={() => router.push(webHrefToMobile("/dashboard/billing") as Href)}
        style={styles.payBtn}
        accessibilityRole="button"
      >
        <Typography variant="small" style={styles.payLabel}>
          Pay now
        </Typography>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: tokens.space.md,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.sm,
    marginBottom: tokens.space.sm,
    borderRadius: tokens.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  warn: {
    backgroundColor: "rgba(255,193,7,0.12)",
    borderColor: "rgba(255,193,7,0.45)",
  },
  urgent: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderColor: "rgba(248,113,113,0.55)",
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    flex: 1,
    minWidth: 0,
  },
  text: {
    flex: 1,
    color: "#fff",
  },
  payBtn: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: 6,
    borderRadius: tokens.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  payLabel: {
    color: "#fff",
    fontWeight: "600",
  },
});
