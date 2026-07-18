import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppCard, Button, InputField, SelectField, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { getPublicPayBaseUrl, getResellerStripeWebhookUrl } from "@/lib/billing/stripe-urls";
import {
  getResellerPaymentSetupStatus,
  isResellerStripeApiReady,
  isResellerStripeWebhookReady,
} from "@/lib/billing/stripe-setup-status";
import {
  useDeleteResellerStripeConfigMutation,
  usePutResellerStripeConfigMutation,
  useResellerBillingPolicyQuery,
  useTestResellerStripeConfigMutation,
} from "@/lib/hooks/query/billing/billing";
import { useAppTheme } from "@/theme";

import { CopyableField } from "./CopyableField";
import { StripeStatusBadge } from "./StripeStatusBadge";

type ResellerStripeSetupPanelProps = {
  resellerId: string;
};

export function ResellerStripeSetupPanel({ resellerId }: ResellerStripeSetupPanelProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const policyQuery = useResellerBillingPolicyQuery(resellerId, { enabled: Boolean(resellerId) });
  const putMutation = usePutResellerStripeConfigMutation();
  const deleteMutation = useDeleteResellerStripeConfigMutation();
  const testMutation = useTestResellerStripeConfigMutation();

  const policy = policyQuery.data?.data;
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const webhookUrl =
    policy?.webhookUrl ??
    (policy?.webhookSlug ? getResellerStripeWebhookUrl(policy.webhookSlug) : "");

  useEffect(() => {
    if (!policyQuery.isSuccess || !policy || hydrated) return;
    setPublishableKey(policy.publishableKey ?? "");
    setIsEnabled(policy.isEnabled !== false);
    setHydrated(true);
  }, [policy, policyQuery.isSuccess, hydrated]);

  const apiReady = isResellerStripeApiReady(policy);
  const webhookReady = isResellerStripeWebhookReady(policy);
  const paymentStatus = getResellerPaymentSetupStatus(policy);

  const handleSave = async () => {
    if (!resellerId) return;
    try {
      await putMutation.mutateAsync({
        resellerId,
        body: {
          publishableKey: publishableKey.trim() || undefined,
          secretKey: secretKey.trim() || undefined,
          webhookSecret: webhookSecret.trim() || undefined,
          isEnabled,
        },
      });
      setSecretKey("");
      setWebhookSecret("");
      Alert.alert("Saved", "Payment settings saved.");
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  const handleTest = async () => {
    if (!resellerId) return;
    const secret = secretKey.trim();
    if (!secret && !policy?.hasSecretKey) {
      Alert.alert("Validation", "Enter your Stripe secret key (sk_...) first, then Test or Save.");
      return;
    }
    try {
      await testMutation.mutateAsync({
        resellerId,
        body: secret ? { secretKey: secret } : undefined,
      });
      Alert.alert("Success", "Stripe connection verified.");
    } catch (err) {
      Alert.alert("Test failed", extractApiErrorMessage(err));
    }
  };

  const handleClear = async () => {
    if (!resellerId) return;
    try {
      await deleteMutation.mutateAsync(resellerId);
      setPublishableKey("");
      setSecretKey("");
      setWebhookSecret("");
      setIsEnabled(false);
      setHydrated(false);
      Alert.alert("Cleared", "Payment settings cleared.");
    } catch (err) {
      Alert.alert("Clear failed", extractApiErrorMessage(err));
    }
  };

  if (policyQuery.isLoading) {
    return (
      <AppCard>
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        <Typography variant="medium" muted style={{ marginTop: 8 }}>
          Loading payment setup…
        </Typography>
      </AppCard>
    );
  }

  return (
    <View style={styles.stack}>
      <AppCard style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Typography variant="medium16" style={{ fontWeight: "700" }}>
              Agency Stripe payment configuration
            </Typography>
            <Typography variant="small" muted>
              Add your Stripe keys and webhook secret. Client invoice payments go to your Stripe account.
            </Typography>
          </View>
          <StripeStatusBadge label={paymentStatus.label} ok={paymentStatus.ok} tone={paymentStatus.tone} />
        </View>

        <View style={styles.badgeRow}>
          <StripeStatusBadge label={apiReady ? "Keys saved" : "Keys missing"} ok={apiReady} />
          <StripeStatusBadge label={webhookReady ? "Webhook saved" : "Webhook missing"} ok={webhookReady} />
        </View>

        {policy?.lastTestedAt ? (
          <Typography variant="small" muted>
            Last test: {policy.lastTestStatus ?? "—"} · {new Date(policy.lastTestedAt).toLocaleString()}
          </Typography>
        ) : null}

        <InputField
          label="Publishable key"
          value={publishableKey}
          onChangeText={setPublishableKey}
          placeholder="pk_test_... or pk_live_..."
          autoCapitalize="none"
        />
        <InputField
          label="Secret key"
          value={secretKey}
          onChangeText={setSecretKey}
          secureTextEntry
          placeholder={policy?.hasSecretKey ? "•••••••• (leave blank to keep)" : "sk_test_... or sk_live_..."}
          autoCapitalize="none"
        />

        <SelectField
          label="Enable payments"
          value={isEnabled ? "yes" : "no"}
          onChange={(v) => setIsEnabled(v === "yes")}
          options={[
            { value: "yes", label: "Yes — allow checkout" },
            { value: "no", label: "No — disable" },
          ]}
        />

        <Button variant="outlined" loading={testMutation.isPending} disabled={testMutation.isPending} onPress={() => void handleTest()}>
          Test Stripe connection
        </Button>

        <View style={styles.section}>
          <Typography variant="medium16" style={{ fontWeight: "600" }}>
            Webhook (checkout.session.completed)
          </Typography>
          <Typography variant="small" muted>
            In Stripe Dashboard → Webhooks, add this agency endpoint and paste the signing secret below.
          </Typography>
          {webhookUrl ? <CopyableField label="Webhook endpoint URL" value={webhookUrl} /> : null}
          <InputField
            label="Webhook signing secret"
            value={webhookSecret}
            onChangeText={setWebhookSecret}
            secureTextEntry
            placeholder={policy?.hasWebhookSecret ? "•••••••• (leave blank to keep)" : "whsec_..."}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.actions}>
          <Button loading={putMutation.isPending} disabled={putMutation.isPending} onPress={() => void handleSave()}>
            Save payment settings
          </Button>
          <Button variant="outlined" loading={deleteMutation.isPending} disabled={deleteMutation.isPending} onPress={() => void handleClear()}>
            Clear keys
          </Button>
        </View>
      </AppCard>

      <AppCard style={styles.card}>
        <Typography variant="medium16" style={{ fontWeight: "700" }}>
          Client pay links
        </Typography>
        <Typography variant="small" muted>
          Invoice emails include a secure pay link using your Stripe keys above.
        </Typography>
        <CopyableField label="Client pay link pattern" value={`${getPublicPayBaseUrl()}/<invoice-token>`} />
        <Button variant="outlined" size="compact" onPress={() => router.push("/billing" as never)}>
          Go to client invoices
        </Button>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  card: { gap: 12 },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  actions: { gap: 10 },
});
