import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import { AppCard, Button, InputField, SelectField, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { getStripeWebhookUrl } from "@/lib/billing/stripe-urls";
import {
  getPlatformPaymentSetupStatus,
  isPlatformStripeApiReady,
  isPlatformStripeWebhookReady,
} from "@/lib/billing/stripe-setup-status";
import {
  useDeletePlatformStripeConfigMutation,
  usePlatformStripeConfigQuery,
  usePutPlatformStripeConfigMutation,
  useTestPlatformStripeConfigMutation,
} from "@/lib/hooks/query/billing/billing";

import { CopyableField } from "./CopyableField";
import { StripeStatusBadge } from "./StripeStatusBadge";

export function PlatformStripeConfigPanel() {
  const configQuery = usePlatformStripeConfigQuery({ enabled: true });
  const putMutation = usePutPlatformStripeConfigMutation();
  const deleteMutation = useDeletePlatformStripeConfigMutation();
  const testMutation = useTestPlatformStripeConfigMutation();

  const config = configQuery.data?.data;
  const [publishableKey, setPublishableKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const webhookUrl = config?.webhookUrl ?? getStripeWebhookUrl();

  useEffect(() => {
    if (!configQuery.isSuccess || !config || hydrated) return;
    setPublishableKey(config.publishableKey ?? "");
    setIsEnabled(config.isEnabled !== false);
    setHydrated(true);
  }, [config, configQuery.isSuccess, hydrated]);

  const apiReady = isPlatformStripeApiReady(config);
  const webhookReady = isPlatformStripeWebhookReady(config);
  const paymentStatus = getPlatformPaymentSetupStatus(config);

  const handleSave = async () => {
    try {
      await putMutation.mutateAsync({
        publishableKey: publishableKey.trim() || undefined,
        secretKey: secretKey.trim() || undefined,
        webhookSecret: webhookSecret.trim() || undefined,
        isEnabled,
      });
      setSecretKey("");
      setWebhookSecret("");
      Alert.alert("Saved", "Payment settings saved.");
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  const handleTest = async () => {
    const secret = secretKey.trim();
    if (!secret && !config?.hasSecretKey) {
      Alert.alert("Validation", "Enter your Stripe secret key (sk_...) first, then Test or Save.");
      return;
    }
    try {
      await testMutation.mutateAsync(secret ? { secretKey: secret } : undefined);
      Alert.alert("Success", "Stripe connection verified.");
    } catch (err) {
      Alert.alert("Test failed", extractApiErrorMessage(err));
    }
  };

  const handleClear = async () => {
    try {
      await deleteMutation.mutateAsync();
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

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: 4 }}>
          <Typography variant="medium16" style={{ fontWeight: "700" }}>
            Stripe payment configuration
          </Typography>
          <Typography variant="small" muted>
            Platform Stripe keys and webhook secret for checkout and invoice sync.
          </Typography>
        </View>
        <StripeStatusBadge label={paymentStatus.label} ok={paymentStatus.ok} tone={paymentStatus.tone} />
      </View>

      <View style={styles.badgeRow}>
        <StripeStatusBadge label={apiReady ? "Keys saved" : "Keys missing"} ok={apiReady} />
        <StripeStatusBadge label={webhookReady ? "Webhook saved" : "Webhook missing"} ok={webhookReady} />
      </View>

      {config?.lastTestedAt ? (
        <Typography variant="small" muted>
          Last test: {config.lastTestStatus ?? "—"} · {new Date(config.lastTestedAt).toLocaleString()}
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
        placeholder={config?.hasSecretKey ? "•••••••• (leave blank to keep)" : "sk_test_... or sk_live_..."}
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
          Add this endpoint in Stripe Dashboard → Webhooks and paste the signing secret below.
        </Typography>
        <CopyableField label="Webhook endpoint URL" value={webhookUrl} />
        <InputField
          label="Webhook signing secret"
          value={webhookSecret}
          onChangeText={setWebhookSecret}
          secureTextEntry
          placeholder={config?.hasWebhookSecret ? "•••••••• (leave blank to keep)" : "whsec_..."}
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
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { gap: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  actions: { gap: 10 },
});
