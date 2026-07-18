import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppCard, Button, Typography } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { usePlatformStripeConfigQuery } from "@/lib/hooks/query/billing/billing";
import { getPlatformPaymentSetupStatus } from "@/lib/billing/stripe-setup-status";
import { useAppTheme } from "@/theme";
import { StripeStatusBadge } from "./components/StripeStatusBadge";

type ActionCardProps = {
  title: string;
  description: string;
  route: string;
  buttonLabel: string;
  primary?: boolean;
};

function ActionCard({ title, description, route, buttonLabel, primary = false }: ActionCardProps) {
  const router = useRouter();
  return (
    <View style={styles.actionCard}>
      <Typography variant="medium16" style={{ fontWeight: "600" }}>
        {title}
      </Typography>
      <Typography variant="small" muted>
        {description}
      </Typography>
      <Button
        size="compact"
        variant={primary ? "primary" : "outlined"}
        onPress={() => router.push(route as never)}
      >
        {buttonLabel}
      </Button>
    </View>
  );
}

/** Platform-admin billing overview — Stripe status + navigation cards. */
export function BillingOverviewPanel() {
  const theme = useAppTheme();
  const { isPlatformAdmin } = useAuth();
  const stripeQuery = usePlatformStripeConfigQuery({ enabled: isPlatformAdmin });

  if (!isPlatformAdmin) return null;

  const stripe = stripeQuery.data?.data;
  const paymentStatus = getPlatformPaymentSetupStatus(stripe);

  return (
    <AppCard style={{ gap: theme.spacing.md }}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="medium16" style={{ fontWeight: "700" }}>
            Billing & payments
          </Typography>
          <Typography variant="small" muted>
            Configure Stripe, agency contract rates, and client invoices.
          </Typography>
        </View>
        <StripeStatusBadge label={paymentStatus.label} ok={paymentStatus.ok} />
      </View>

      <ActionCard
        title="Invoices"
        description="View and manage client invoices."
        route="/billing/index"
        buttonLabel="Open invoices"
        primary
      />
      <ActionCard
        title="Website contracts"
        description="Per-website billing rates and contract setup."
        route="/billing/index"
        buttonLabel="View contracts"
      />
      <ActionCard
        title="Payment setup"
        description="Stripe keys, webhook, and checkout configuration."
        route="/billing/index"
        buttonLabel="Payment setup"
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  actionCard: { gap: 8, paddingTop: 4 },
});
