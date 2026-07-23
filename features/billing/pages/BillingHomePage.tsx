import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { openStripeCheckout } from "@/lib/billing/open-stripe-checkout";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";
import {
  useCheckoutInvoiceMutation,
  useCreateResellerCheckoutMutation,
  useInvoicesQuery,
  useMyResellerSubscriptionQuery,
} from "@/lib/hooks/query/billing/billing";
import type { InvoiceView } from "@/api/billing/invoice.api";
import { InvoiceStatusBadge } from "../components/InvoiceStatusBadge";

function money(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  return `${currency ?? "USD"} ${amount.toFixed(2)}`;
}

function isUnpaidInvoice(status: string | null | undefined): boolean {
  const s = status?.toLowerCase() ?? "";
  return s !== "paid" && s !== "void" && s !== "cancelled";
}

export function BillingHomePage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, isPlatformAdmin } = useAuth();
  const isResellerAdmin = user?.wideResellerScope === true && !isPlatformAdmin;
  const [search, setSearch] = useState("");
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  const subscriptionQuery = useMyResellerSubscriptionQuery({
    enabled: Boolean(user?.resellerId) && isResellerAdmin,
  });
  const invoicesQuery = useInvoicesQuery({ page: 1, limit: 50 });
  const subscriptionCheckoutMutation = useCreateResellerCheckoutMutation();
  const invoiceCheckoutMutation = useCheckoutInvoiceMutation();

  const invoices = useMemo(() => {
    const items = invoicesQuery.data?.data.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q) || inv.companyName.toLowerCase().includes(q),
    );
  }, [invoicesQuery.data, search]);

  const sub = subscriptionQuery.data?.data;
  const paymentPending = Boolean(sub?.paymentPending ?? sub?.showCountdown ?? sub?.isExpired);

  const handleSubscriptionPay = () => {
    subscriptionCheckoutMutation.mutate(undefined, {
      onSuccess: async (res) => {
        const url = res.data.checkoutUrl;
        if (!url) {
          Alert.alert("Checkout", "Checkout URL not available.");
          return;
        }
        await openStripeCheckout(url);
      },
      onError: (err) => Alert.alert("Could not start checkout", extractApiErrorMessage(err)),
    });
  };

  const handleInvoicePay = (invoiceId: string) => {
    setPayingInvoiceId(invoiceId);
    invoiceCheckoutMutation.mutate(invoiceId, {
      onSuccess: async (res) => {
        const url = res.data.checkoutUrl;
        if (!url) {
          Alert.alert("Checkout", "No checkout URL was returned.");
          return;
        }
        await openStripeCheckout(url);
      },
      onError: (err) => Alert.alert("Could not start checkout", extractApiErrorMessage(err)),
      onSettled: () => setPayingInvoiceId(null),
    });
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Billing</Typography>
        <Typography variant="medium" muted>
          Subscription, invoices, and secure Stripe payments.
        </Typography>
      </View>

      {isPlatformAdmin ? (
        <AppCard style={{ gap: 10, marginBottom: theme.spacing.md }}>
          <Typography variant="medium16" style={{ fontWeight: "700" }}>
            Platform billing setup
          </Typography>
          <Typography variant="small" muted>
            Configure Stripe and manage reseller plans.
          </Typography>
          <View style={styles.linkRow}>
            <Button size="compact" variant="outlined" onPress={() => router.push("/billing/payments" as never)}>
              Payment setup
            </Button>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => router.push("/billing/reseller-subscriptions" as never)}
            >
              Reseller plans
            </Button>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => router.push("/billing/website-contracts" as never)}
            >
              Contracts
            </Button>
          </View>
        </AppCard>
      ) : null}

      {isResellerAdmin && subscriptionQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} style={{ marginBottom: theme.spacing.md }} />
      ) : null}

      {isResellerAdmin && sub ? (
        <AppCard
          style={[
            { gap: 8, marginBottom: theme.spacing.md },
            paymentPending && {
              borderColor: sub.isExpired ? "rgba(248,113,113,0.45)" : "rgba(255,193,7,0.4)",
              borderWidth: 1,
            },
          ]}
        >
          <View style={styles.rowBetween}>
            <Typography variant="medium16">{sub.planName}</Typography>
            <Typography variant="small" color={theme.app.dashboard.accentBlue} style={{ textTransform: "capitalize" }}>
              {sub.status}
            </Typography>
          </View>
          <Typography variant="small" muted>
            {sub.billingCycle} · {sub.currency} {sub.price} · renews {sub.endDate?.slice(0, 10) ?? "—"}
          </Typography>
          {sub.showCountdown ? (
            <Typography variant="small" color={theme.app.dashboard.accentOrange}>
              {sub.daysRemaining} day{sub.daysRemaining === 1 ? "" : "s"} remaining
            </Typography>
          ) : null}
          {paymentPending ? (
            <Button
              loading={subscriptionCheckoutMutation.isPending}
              disabled={subscriptionCheckoutMutation.isPending}
              onPress={handleSubscriptionPay}
              style={{ marginTop: 4 }}
            >
              {sub.isExpired ? "Renew subscription" : "Pay now"}
            </Button>
          ) : null}
        </AppCard>
      ) : null}

      {isResellerAdmin && !subscriptionQuery.isLoading && !sub ? (
        <AppCard style={{ gap: 6, marginBottom: theme.spacing.md }}>
          <Typography variant="medium16" style={{ fontWeight: "600" }}>
            No platform subscription assigned
          </Typography>
          <Typography variant="small" muted>
            Contact platform support to activate your reseller plan.
          </Typography>
        </AppCard>
      ) : null}

      <SearchBar value={search} onChange={setSearch} placeholder="Search invoices…" />

      <Typography variant="small" muted style={{ marginTop: theme.spacing.sm, marginBottom: 4 }}>
        Invoices
      </Typography>

      {invoicesQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : invoicesQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(invoicesQuery.error, "Could not load invoices.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item: InvoiceView) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No invoices yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => {
            const unpaid = isUnpaidInvoice(item.status);
            const paying = payingInvoiceId === item.id && invoiceCheckoutMutation.isPending;

            return (
              <AppCard style={{ gap: 8 }}>
                <Pressable onPress={() => router.push(`/billing/invoices/${item.id}` as never)}>
                  <View style={{ gap: 4 }}>
                    <View style={styles.rowBetween}>
                      <Typography variant="medium16">{item.invoiceNumber ?? item.companyName}</Typography>
                      <InvoiceStatusBadge status={item.status} />
                    </View>
                    <Typography variant="small" muted>
                      {item.companyName} · {item.issuedDate?.slice(0, 10)}
                    </Typography>
                    <Typography variant="medium">{money(item.totalAmount, item.currency)}</Typography>
                  </View>
                </Pressable>
                {unpaid ? (
                  <View style={styles.invoiceActions}>
                    <Button
                      size="compact"
                      variant="outlined"
                      onPress={() => router.push(`/billing/invoices/${item.id}` as never)}
                    >
                      View
                    </Button>
                    <Button
                      size="compact"
                      loading={paying}
                      disabled={paying}
                      onPress={() => handleInvoicePay(item.id)}
                    >
                      Pay
                    </Button>
                  </View>
                ) : null}
              </AppCard>
            );
          }}
  showsVerticalScrollIndicator={false}/>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  linkRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  invoiceActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
});
