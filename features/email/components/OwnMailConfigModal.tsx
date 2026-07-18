import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import {
  Button,
  Checkbox,
  FormModal,
  InputField,
  SelectField,
  SegmentedControl,
  Typography,
} from "@/components/ui";
import {
  useResellerOwnMailSettingsQuery,
  usePlatformEmailSettingsQuery,
  useTestPlatformEmailSettingsMutation,
  useTestResellerOwnMailMutation,
  useUpdatePlatformEmailSettingsMutation,
  useUpdateResellerOwnMailMutation,
} from "@/features/email/hooks/useEmailSettings";
import { useOwnMailProviderForm } from "@/features/email/hooks/useOwnMailProviderForm";
import { useSmtpEmailAccess } from "@/features/email/hooks/useSmtpEmailAccess";
import { GMAIL_SMTP_TIP } from "@/features/email/email.constants";
import { isSecretField, secretFieldPlaceholder } from "@/features/email/utils/email-fields-payload";
import { schemaFieldKey } from "@/features/email/utils/schema-fields";
import { pickItemsArray, toIdNameOption } from "@/lib/companies/scope-tree-options";
import { useCompaniesSetupResellersQuery } from "@/lib/hooks/query/companies";

type Mode = "platform" | "reseller";

export type OwnMailConfigModalProps = {
  open: boolean;
  mode: Mode;
  resellerId?: string;
  resellerLabel?: string;
  lockedResellerId?: string | null;
  onClose: () => void;
  onSaved?: () => void;
};

export function OwnMailConfigModal({
  open,
  mode,
  resellerId: initialResellerId = "",
  resellerLabel,
  lockedResellerId = null,
  onClose,
  onSaved,
}: OwnMailConfigModalProps) {
  const { canUpdate, canTest } = useSmtpEmailAccess();
  const [resellerId, setResellerId] = useState(initialResellerId);
  const activeResellerId = (lockedResellerId ?? resellerId).trim();

  useEffect(() => {
    if (open) setResellerId(initialResellerId);
  }, [open, initialResellerId]);

  const platformQuery = usePlatformEmailSettingsQuery({
    enabled: open && mode === "platform",
  });
  const resellerQuery = useResellerOwnMailSettingsQuery(activeResellerId, {
    enabled: open && mode === "reseller" && Boolean(activeResellerId),
  });

  const updatePlatform = useUpdatePlatformEmailSettingsMutation();
  const updateReseller = useUpdateResellerOwnMailMutation(activeResellerId);
  const testPlatform = useTestPlatformEmailSettingsMutation();
  const testReseller = useTestResellerOwnMailMutation(activeResellerId);

  const settings = mode === "platform" ? platformQuery.data : resellerQuery.data;

  const onSave = useCallback(
    async (body: Parameters<typeof updatePlatform.mutateAsync>[0]) => {
      if (mode === "platform") return updatePlatform.mutateAsync(body);
      return updateReseller.mutateAsync(body);
    },
    [mode, updatePlatform, updateReseller],
  );

  const onTest = useCallback(
    async (body: { toEmail?: string }) => {
      if (mode === "platform") return testPlatform.mutateAsync(body);
      return testReseller.mutateAsync(body);
    },
    [mode, testPlatform, testReseller],
  );

  const form = useOwnMailProviderForm({
    enabled: open && (mode === "platform" || Boolean(activeResellerId)),
    settings,
    onSave,
    onTest: canTest ? onTest : undefined,
  });

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && mode === "reseller" && !lockedResellerId,
  });
  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((x): x is { label: string; value: string } => x !== null),
    [resellersQuery.data],
  );

  const schemaFields = form.schemaQuery.data?.fields ?? [];
  const saving = updatePlatform.isPending || updateReseller.isPending;
  const testing = testPlatform.isPending || testReseller.isPending;

  const title =
    mode === "platform"
      ? "Platform mail"
      : lockedResellerId || initialResellerId
        ? "Edit reseller mail"
        : "Add reseller mail";

  return (
    <FormModal
      open={open}
      title={title}
      description={
        mode === "platform"
          ? "Global SMTP/API used when resellers are assigned to platform mail."
          : "Configure SMTP or API credentials for this reseller."
      }
      onClose={onClose}
      onSave={async () => {
        if (!canUpdate) return;
        if (mode === "reseller" && !activeResellerId) return;
        const ok = await form.handleSave();
        if (ok) {
          onSaved?.();
          onClose();
        }
      }}
      primaryButtonLabel={saving ? "Saving…" : "Save"}
      primaryButtonDisabled={saving || !canUpdate || (mode === "reseller" && !activeResellerId)}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        {mode === "reseller" && lockedResellerId ? (
          <Typography variant="small" muted>
            Reseller: {resellerLabel?.trim() || lockedResellerId}
          </Typography>
        ) : null}

        {mode === "reseller" && !lockedResellerId ? (
          <SelectField
            label="Reseller"
            value={resellerId}
            onChange={setResellerId}
            options={
              resellerOptions.length
                ? resellerOptions
                : [{ value: "", label: resellersQuery.isLoading ? "Loading…" : "No resellers" }]
            }
          />
        ) : null}

        {mode === "reseller" && !activeResellerId ? (
          <Typography variant="small" muted>
            Select a reseller to continue.
          </Typography>
        ) : (
          <>
            {form.availableKinds.length > 0 ? (
              <SegmentedControl
                value={form.providerKind ?? form.availableKinds[0]}
                onChange={(v) => form.handleKindSelect(v as "smtp" | "api")}
                options={form.availableKinds.map((k) => ({
                  value: k,
                  label: k.toUpperCase(),
                }))}
              />
            ) : null}

            <SelectField
              label="Provider"
              value={form.providerId ?? ""}
              onChange={(id) => {
                const provider = form.providersForKind.find((p) => p.id === id);
                if (provider) form.handleProviderSelect(provider);
              }}
              options={
                form.providersForKind.length
                  ? form.providersForKind.map((p) => ({ value: p.id, label: p.name || p.code }))
                  : [{ value: "", label: form.providersQuery.isLoading ? "Loading…" : "Select kind first" }]
              }
            />

            <InputField
              label="From email"
              value={form.fromEmail}
              onChangeText={form.setFromEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <InputField label="From name" value={form.fromName} onChangeText={form.setFromName} />

            <Checkbox
              checked={form.isEnabled}
              onChange={(next) => form.setIsEnabled(next)}
              label="Enabled"
            />

            {schemaFields.map((field) => {
              const key = schemaFieldKey(field);
              return (
                <InputField
                  key={key}
                  label={field.label || key}
                  value={form.fieldValues[key] ?? ""}
                  onChangeText={(v) => form.setFieldValues((prev) => ({ ...prev, [key]: v }))}
                  autoCapitalize="none"
                  secureTextEntry={isSecretField(field)}
                  placeholder={secretFieldPlaceholder(field, settings?.fields)}
                />
              );
            })}

            {form.showGmailTip ? (
              <Typography variant="small" muted>
                {GMAIL_SMTP_TIP}
              </Typography>
            ) : null}

            {canTest ? (
              <View style={{ gap: 8, marginTop: 4 }}>
                <InputField
                  label="Test recipient"
                  value={form.testToEmail}
                  onChangeText={form.setTestToEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@company.com"
                />
                <Button
                  variant="outlined"
                  size="compact"
                  loading={testing}
                  disabled={testing}
                  onPress={() => void form.handleTest()}
                >
                  Send test email
                </Button>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </FormModal>
  );
}
