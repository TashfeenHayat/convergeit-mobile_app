import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  EmailProvider,
  EmailProviderKind,
  EmailTestResult,
  MailProviderSettings,
  MailProviderSettingsBody,
} from "../types";
import { schemaFieldKey } from "../utils/schema-fields";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import { groupProvidersByKind } from "../utils/group-providers-by-kind";
import { resolveProviderKind } from "../utils/email-settings-normalize";
import {
  buildFieldsPayload,
  normalizeFieldValuesForDisplay,
  validateRequiredMailFields,
} from "../utils/email-fields-payload";
import {
  extractEmailTestErrorMessage,
  formatMailTestErrorMessage,
  readTestMessage,
  validateTestToEmail,
} from "../utils/email-test.utils";
import { useEmailProvidersQuery, useEmailProviderSchemaQuery } from "./useEmailProviders";

function settingsFingerprint(settings: MailProviderSettings | undefined): string {
  if (!settings) return "";
  const fieldKeys = Object.keys(settings.fields ?? {}).sort().join(",");
  return [
    settings.emailProviderId ?? "",
    settings.updatedAt ?? "",
    settings.fromEmail ?? "",
    fieldKeys,
  ].join("|");
}

export function useOwnMailProviderForm({
  enabled,
  settings,
  onSave,
  onTest,
}: {
  enabled: boolean;
  settings: MailProviderSettings | undefined;
  onSave: (body: MailProviderSettingsBody) => Promise<unknown>;
  onTest?: (body: { toEmail?: string }) => Promise<EmailTestResult>;
}) {
  const [providerKind, setProviderKind] = useState<EmailProviderKind | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [testToEmail, setTestToEmail] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);

  const fingerprint = useMemo(() => settingsFingerprint(settings), [settings]);

  const providersQuery = useEmailProvidersQuery({ enabled });
  const schemaQuery = useEmailProviderSchemaQuery(providerId, {
    enabled: enabled && Boolean(providerId),
  });

  const providerGroups = useMemo(
    () => groupProvidersByKind(providersQuery.data ?? []),
    [providersQuery.data],
  );

  const providersForKind = useMemo(() => {
    if (!providerKind) return [];
    return providerGroups.find((g) => g.kind === providerKind)?.providers ?? [];
  }, [providerGroups, providerKind]);

  const selectedProvider = useMemo(
    () => (providersQuery.data ?? []).find((p) => p.id === providerId) ?? null,
    [providersQuery.data, providerId],
  );

  useEffect(() => {
    if (!enabled || !settings) return;

    const pid = settings.emailProviderId ?? null;
    setProviderId(pid);
    setFromEmail(settings.fromEmail ?? "");
    setFromName(settings.fromName ?? "");
    setIsEnabled(Boolean(settings.isEnabled));
    setSavedOnce(Boolean(pid));

    if (pid) {
      const fromList = (providersQuery.data ?? []).find((x) => x.id === pid);
      if (fromList) {
        setProviderKind(resolveProviderKind(fromList) ?? "api");
      } else if (settings.providerKind) {
        setProviderKind(settings.providerKind);
      } else if (settings.providerCode) {
        setProviderKind(resolveProviderKind({ code: settings.providerCode }) ?? "api");
      }
    } else {
      setProviderKind(null);
    }
  }, [enabled, fingerprint, providersQuery.data, settings]);

  useEffect(() => {
    const schemaFields = schemaQuery.data?.fields;
    if (!enabled || !providerId || !schemaFields?.length) return;

    const saved = settings?.fields ?? {};
    setFieldValues((prev) => {
      const fromSaved = normalizeFieldValuesForDisplay(saved, schemaFields);
      const next = { ...normalizeFieldValuesForDisplay(prev, schemaFields), ...fromSaved };
      for (const f of schemaFields) {
        const fk = schemaFieldKey(f);
        if (!next[fk]?.trim()) next[fk] = f.defaultValue ?? "";
      }
      return next;
    });
  }, [enabled, fingerprint, providerId, schemaQuery.data?.fields, settings?.fields]);

  const handleKindSelect = (kind: EmailProviderKind) => {
    setProviderKind(kind);
    setProviderId(null);
    setFieldValues({});
  };

  const handleProviderSelect = (provider: EmailProvider) => {
    if (provider.id !== providerId) setFieldValues({});
    setProviderId(provider.id);
    setProviderKind(resolveProviderKind(provider) ?? providerKind);
  };

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (!providerId) {
      publishAppToast({ variant: "error", message: "Select a provider." });
      return false;
    }
    const schemaFields = schemaQuery.data?.fields ?? [];
    const validationError = validateRequiredMailFields(schemaFields, fieldValues, settings?.fields);
    if (validationError) {
      publishAppToast({ variant: "error", message: validationError });
      return false;
    }
    try {
      await onSave({
        emailProviderId: providerId,
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim() || undefined,
        isEnabled,
        fields: buildFieldsPayload(schemaFields, fieldValues, settings?.fields),
      });
      setSavedOnce(true);
      publishAppToast({ variant: "success", message: "Mail settings saved." });
      return true;
    } catch (err) {
      publishAppToast({
        variant: "error",
        message: extractApiErrorMessageForToast(err) ?? "Could not save mail settings.",
      });
      return false;
    }
  }, [
    providerId,
    schemaQuery.data?.fields,
    fieldValues,
    settings?.fields,
    fromEmail,
    fromName,
    isEnabled,
    onSave,
  ]);

  const handleTest = useCallback(
    async (opts?: { toEmail?: string }) => {
      if (!onTest) {
        return { success: false, message: "Test is not available." };
      }
      const recipient = opts?.toEmail ?? testToEmail;
      const validationError = validateTestToEmail(recipient);
      if (validationError) {
        publishAppToast({ variant: "error", message: validationError });
        throw new Error(validationError);
      }
      try {
        const result = await onTest({ toEmail: recipient.trim() || undefined });
        const raw = readTestMessage(result.message);
        return {
          ...result,
          message: result.success
            ? raw ?? "Test email sent."
            : formatMailTestErrorMessage(raw ?? "Test failed."),
        };
      } catch (err) {
        return { success: false, message: extractEmailTestErrorMessage(err) };
      }
    },
    [onTest, testToEmail],
  );

  return {
    providerKind,
    providerId,
    availableKinds: providerGroups.map((g) => g.kind),
    providersForKind,
    selectedProvider,
    fromEmail,
    setFromEmail,
    fromName,
    setFromName,
    isEnabled,
    setIsEnabled,
    fieldValues,
    setFieldValues,
    testToEmail,
    setTestToEmail,
    providersQuery,
    schemaQuery,
    handleKindSelect,
    handleProviderSelect,
    handleSave,
    handleTest,
    savedOnce,
    showGmailTip: selectedProvider?.code === "custom_smtp",
    settingsFingerprint: fingerprint,
  };
}
