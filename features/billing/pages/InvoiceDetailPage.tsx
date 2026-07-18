import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { openStripeCheckout } from "@/lib/billing/open-stripe-checkout";
import { useAppTheme } from "@/theme";
import { useCheckoutInvoiceMutation, useInvoiceQuery } from "@/lib/hooks/query/billing/billing";
import { InvoiceStatusBadge } from "../components/InvoiceStatusBadge";

function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `${currency ?? "USD"} ${amount.toFixed(2)}`;
}

export function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  const theme = useAppTheme();
  const query = useInvoiceQuery(invoiceId);
  const checkoutMutation = useCheckoutInvoiceMutation();
  const invoice = query.data?.data;

  const onPay = () => {
    checkoutMutation.mutate(invoiceId, {
      onSuccess: async (res) => {
        const url = res.data.checkoutUrl;
        if (url) await openStripeCheckout(url);
        else Alert.alert("Checkout", "No checkout URL was returned.");
      },
      onError: (err) => Alert.alert("Could not start checkout", extractApiErrorMessage(err)),
    });
  };

  if (query.isLoading) {
    return (
      <MobileScreen>
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      </MobileScreen>
    );
  }

  if (query.isError || !invoice) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, "Could not load invoice.")}
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.md }}>
        <View style={styles.rowBetween}>
          <Typography variant="boldLarge">{invoice.invoiceNumber ?? "Invoice"}</Typography>
          <InvoiceStatusBadge status={invoice.status} />
        </View>

        <AppCard style={{ gap: 8 }}>
          <Field label="Company" value={invoice.companyName} />
          <Field
            label="Period"
            value={`${invoice.periodStart?.slice(0, 10) ?? "—"} → ${invoice.periodEnd?.slice(0, 10) ?? "—"}`}
          />
          <Field label="Issued" value={invoice.issuedDate?.slice(0, 10) ?? "—"} />
          <Field label="Due" value={invoice.dueDate?.slice(0, 10) ?? "—"} />
          <Field label="Total" value={money(invoice.totalAmount, invoice.currency)} />
        </AppCard>

        <AppCard style={{ gap: theme.spacing.sm }}>
          <Typography variant="medium16">Line items</Typography>
          <FlatList
            data={invoice.lineItems}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Typography variant="small" muted>
                No line items.
              </Typography>
            }
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 6, gap: 2 }}>
                <Typography variant="medium">{item.websiteName ?? item.websiteUrl}</Typography>
                <Typography variant="small" muted>
                  {item.billableChats} billable chats · {money(item.lineTotal, invoice.currency)}
                </Typography>
              </View>
            )}
          />
        </AppCard>

        {invoice.status !== "paid" ? (
          <Button fullWidth disabled={checkoutMutation.isPending} loading={checkoutMutation.isPending} onPress={onPay}>
            Pay invoice
          </Button>
        ) : null}
      </View>
    </MobileScreen>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium16">{value}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  separator: { height: 1, backgroundColor: "rgba(255,255,255,0.08)" },
});
