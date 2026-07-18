import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppCard, Button, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { openStripeCheckout } from "@/lib/billing/open-stripe-checkout";
import {
  useCheckoutPublicInvoiceMutation,
  usePublicInvoiceQuery,
} from "@/lib/hooks/query/billing/billing";
import { useAppTheme } from "@/theme";

import { InvoiceProfessionalDocument } from "./InvoiceProfessionalDocument";
import { PayPageShell } from "./PayPageShell";

export function PublicPayPageClient() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const rawToken = params.token;
  const token = decodeURIComponent(
    String(Array.isArray(rawToken) ? rawToken[0] : rawToken ?? ""),
  ).trim();

  const invoiceQuery = usePublicInvoiceQuery(token);
  const checkoutMutation = useCheckoutPublicInvoiceMutation();
  const invoice = invoiceQuery.data?.data;

  const handlePay = () => {
    checkoutMutation.mutate(token, {
      onSuccess: async (res) => {
        const url = res.data.checkoutUrl;
        if (!url) {
          Alert.alert("Payment", "Payment link unavailable.");
          return;
        }
        await openStripeCheckout(url);
      },
      onError: (err) => Alert.alert("Could not start payment", extractApiErrorMessage(err)),
    });
  };

  if (!token) {
    return (
      <PayPageShell title="Invalid link">
        <Typography variant="medium" muted style={styles.centered}>
          Invalid payment link.
        </Typography>
      </PayPageShell>
    );
  }

  if (invoiceQuery.isLoading) {
    return (
      <PayPageShell title="Loading">
        <ActivityIndicator color={theme.app.dashboard.accentBlue} style={styles.loader} />
        <Typography variant="medium" muted style={styles.centered}>
          Loading invoice…
        </Typography>
      </PayPageShell>
    );
  }

  if (!invoice) {
    return (
      <PayPageShell title="Not found">
        <Typography variant="medium" muted style={styles.centered}>
          Invoice not found or expired.
        </Typography>
      </PayPageShell>
    );
  }

  const isPaid = invoice.status === "paid";
  const currency = invoice.currency ?? "USD";

  return (
    <PayPageShell title={isPaid ? "Invoice paid" : "Pay invoice"}>
      <View style={{ gap: theme.spacing.md }}>
        {invoiceQuery.isFetching ? (
          <ActivityIndicator color={theme.app.dashboard.accentBlue} size="small" />
        ) : null}

        {!isPaid ? (
          <AppCard style={styles.payBanner}>
            <View style={{ flex: 1, gap: 4 }}>
              <Typography variant="medium16" style={{ fontWeight: "700" }}>
                Amount due: {currency} {invoice.totalAmount.toFixed(2)}
              </Typography>
              <Typography variant="small" muted>
                Secure payment via Stripe · Due {invoice.dueDate?.slice(0, 10) ?? "—"}
              </Typography>
            </View>
            <Button
              loading={checkoutMutation.isPending}
              disabled={checkoutMutation.isPending}
              onPress={handlePay}
            >
              Pay with card
            </Button>
          </AppCard>
        ) : (
          <AppCard style={[styles.payBanner, styles.paidBanner]}>
            <Typography variant="medium16" color={theme.app.dashboard.accentGreen} style={{ fontWeight: "700", textAlign: "center" }}>
              Paid — thank you!
            </Typography>
          </AppCard>
        )}

        <InvoiceProfessionalDocument invoice={invoice} />

        <Button variant="outlined" onPress={() => router.push("/billing" as never)}>
          Back to billing
        </Button>
      </View>
    </PayPageShell>
  );
}

const styles = StyleSheet.create({
  centered: { textAlign: "center" },
  loader: { marginVertical: 24 },
  payBanner: {
    gap: 12,
  },
  paidBanner: {
    alignItems: "center",
  },
});
