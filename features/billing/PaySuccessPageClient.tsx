import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { AppCard, Button, Typography } from "@/components/ui";
import type { CheckoutConfirmResult, InvoiceView } from "@/api/billing/invoice.api";
import { confirmCheckoutSession } from "@/api/billing/invoice.api";
import { useAppTheme } from "@/theme";

import { PayPageShell } from "./PayPageShell";

type PageState = "loading" | "confirmed" | "pending" | "error";

const CONFIRM_ATTEMPTS = 8;
const CONFIRM_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function confirmSourceLabel(result: CheckoutConfirmResult | undefined): string | null {
  if (!result?.confirmed) return null;
  switch (result.confirmedBy) {
    case "webhook":
      return "Confirmed automatically via Stripe webhook.";
    case "api":
      return "Confirmed via secure payment verification (webhook not configured).";
    case "api_fallback":
      return "Confirmed via payment verification. Add a Stripe webhook for faster automatic sync.";
    case "already_paid":
      return "This invoice was already marked as paid.";
    default:
      return null;
  }
}

async function confirmWithRetry(sessionId: string) {
  let lastResult: CheckoutConfirmResult | undefined;

  for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt += 1) {
    const res = await confirmCheckoutSession(sessionId);
    lastResult = res.data;
    if (lastResult.confirmed) {
      return { confirmed: true as const, invoice: lastResult.invoice, result: lastResult };
    }
    if (attempt < CONFIRM_ATTEMPTS - 1) {
      await sleep(CONFIRM_DELAY_MS);
    }
  }

  return { confirmed: false as const, invoice: lastResult?.invoice, result: lastResult };
}

function money(invoice: InvoiceView | undefined): string | null {
  if (!invoice) return null;
  return `${invoice.currency ?? "USD"} ${invoice.totalAmount.toFixed(2)}`;
}

export function PaySuccessPageClient() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ session_id?: string | string[] }>();
  const rawSession = params.session_id;
  const sessionId = String(Array.isArray(rawSession) ? rawSession[0] : rawSession ?? "").trim();

  const [state, setState] = useState<PageState>(sessionId ? "loading" : "pending");
  const [invoice, setInvoice] = useState<InvoiceView | undefined>();
  const [confirmResult, setConfirmResult] = useState<CheckoutConfirmResult | undefined>();
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    void (async () => {
      try {
        const outcome = await confirmWithRetry(sessionId);
        if (cancelled) return;
        setInvoice(outcome.invoice);
        setConfirmResult(outcome.result);
        setState(outcome.confirmed ? "confirmed" : "pending");
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, retryKey]);

  const headline =
    state === "loading"
      ? "Confirming your payment…"
      : state === "confirmed"
        ? "Thank you — payment complete"
        : state === "error"
          ? "Payment received — sync pending"
          : "Payment is being processed";

  const description =
    state === "loading"
      ? confirmResult?.webhookConfigured
        ? "Please wait while Stripe webhook or payment verification updates your invoice."
        : "Please wait while we verify your Stripe payment and update the invoice."
      : state === "confirmed"
        ? confirmSourceLabel(confirmResult) ??
          "Your card was charged successfully. The invoice is now marked as paid."
        : state === "error"
          ? "Stripe charged your card but we could not sync automatically. Your payment is safe — refresh shortly or contact support with your session id."
          : confirmResult?.webhookConfigured
            ? "Stripe accepted your payment. Waiting for webhook confirmation — this usually takes a few seconds."
            : "Stripe accepted your payment. Retrying verification automatically…";

  const iconColor =
    state === "confirmed"
      ? theme.app.dashboard.accentGreen
      : state === "error" || state === "pending"
        ? theme.app.dashboard.accentOrange
        : theme.app.dashboard.accentBlue;

  const iconName =
    state === "confirmed"
      ? "checkmark-circle-outline"
      : state === "loading"
        ? "hourglass-outline"
        : state === "error"
          ? "alert-circle-outline"
          : "time-outline";

  const invoiceToken = invoice?.publicPaymentToken?.trim() ?? "";
  const amount = money(invoice);

  return (
    <PayPageShell title={state === "confirmed" ? "Payment successful" : "Confirming payment"}>
      <AppCard style={styles.card}>
        {state === "loading" ? (
          <ActivityIndicator color={theme.app.dashboard.accentBlue} size="large" style={styles.icon} />
        ) : (
          <Ionicons name={iconName} size={56} color={iconColor} style={styles.icon} />
        )}

        <Typography variant="boldLarge" style={styles.headline}>
          {headline}
        </Typography>
        <Typography variant="medium" muted style={styles.description}>
          {description}
        </Typography>

        {invoice ? (
          <View style={styles.receipt}>
            <ReceiptRow label="Invoice" value={`#${invoice.invoiceNumber ?? invoice.id.slice(0, 8)}`} />
            {amount ? <ReceiptRow label="Amount paid" value={amount} /> : null}
            <ReceiptRow
              label="Status"
              value={state === "confirmed" ? "paid" : invoice.status}
              valueColor={state === "confirmed" ? theme.app.dashboard.accentGreen : theme.app.dashboard.accentOrange}
            />
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button variant="outlined" onPress={() => router.push("/billing" as never)}>
            Back to billing
          </Button>
          {invoiceToken ? (
            <Button onPress={() => router.push(`/pay/${encodeURIComponent(invoiceToken)}` as never)}>
              View invoice
            </Button>
          ) : null}
          {state === "pending" || state === "error" ? (
            <Button variant="secondary" onPress={() => setRetryKey((k) => k + 1)}>
              Refresh status
            </Button>
          ) : null}
        </View>

        {sessionId && (state === "error" || state === "pending") ? (
          <Typography variant="small" muted style={styles.reference}>
            Reference: {sessionId}
          </Typography>
        ) : null}

        {state === "confirmed" ? (
          <Typography variant="small" muted style={styles.footerNote}>
            A receipt may be emailed if configured in Stripe. You can close this screen.
          </Typography>
        ) : null}
      </AppCard>
    </PayPageShell>
  );
}

function ReceiptRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.receiptRow}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="medium" style={{ fontWeight: "600", textTransform: "capitalize", color: valueColor }}>
        {value}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 24,
  },
  icon: {
    marginBottom: 4,
  },
  headline: {
    textAlign: "center",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 340,
  },
  receipt: {
    alignSelf: "stretch",
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  actions: {
    alignSelf: "stretch",
    gap: 10,
    marginTop: 8,
  },
  reference: {
    textAlign: "center",
    fontFamily: "SpaceMono",
    marginTop: 4,
  },
  footerNote: {
    textAlign: "center",
    marginTop: 4,
  },
});
