import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MobileScreen } from "@/components/layout";
import { AppCard, Button, InputField, Typography } from "@/components/ui";
import { ScopeSelectField } from "@/features/chat-shared";
import { tokens } from "@/theme/tokens";
import { fetchAgentWrapUp, submitAgentWrapUp } from "@/services/chat/wrap-up.api";
import type { AgentWrapUpDisposition, AgentWrapUpEmailField, SubmitAgentWrapUpBody } from "@/services/chat/wrap-up.types";
import { extractApiErrorMessageForToast, publishAppToast } from "@/lib/notify";
import { useAuth } from "@/lib/auth";
import { canWidgetSettingsFromArrays } from "@/lib/permissions/chat-access";
import { DEFAULT_CHAT_OPERATIONS, mergeChatOperationsJson } from "@/services/chat/chat-settings.defaults";
import { fetchWebsiteChatSettings } from "@/services/chat/chat-settings.api";
import { agentDistributionFieldMultiline } from "../utils/agent-distribution-form.utils";
import { resolveDashboardHref } from "../utils/resolve-dashboard-href";

const DISPOSITIONS: Array<{ value: AgentWrapUpDisposition; label: string }> = [
  { value: "resolved", label: "Resolved" },
  { value: "pending_follow_up", label: "Pending follow-up" },
  { value: "no_response", label: "No response" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

function StarRating({ value, max, onChange, disabled }: { value: number | null; max: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <Pressable key={star} onPress={() => !disabled && onChange(star)} hitSlop={4}>
          <Ionicons
            name={value != null && star <= value ? "star" : "star-outline"}
            size={28}
            color={value != null && star <= value ? tokens.colors.accentOrange : tokens.colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

function WrapUpFieldInput({ field, value, onChange, readOnly }: { field: AgentWrapUpEmailField; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  const multiline = agentDistributionFieldMultiline(field.fieldType, field.fieldKey);
  return <InputField label={field.label} value={value} onChangeText={onChange} multiline={multiline} editable={!readOnly} />;
}

/**
 * Standalone wrap-up screen — navigated to from `AgentWrapUpModal`'s parent flow
 * or deep-linked from a push notification / distribution prompt. Mirrors web's
 * `AgentWrapUpPage`, redirecting into the distribution or setup flow when the
 * conversation still requires it.
 */
export function AgentWrapUpPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ conversationId?: string }>();
  const conversationId = String(params.conversationId ?? "").trim();
  const { pagePermissions, operationalPermissions, isPlatformAdmin } = useAuth();
  const canLoadWidgetSettings = canWidgetSettingsFromArrays({ page: pagePermissions, operational: operationalPermissions, isPlatformAdmin });

  const formQuery = useQuery({
    queryKey: ["agent-wrap-up-form", conversationId],
    queryFn: () => fetchAgentWrapUp(conversationId),
    enabled: Boolean(conversationId),
  });

  const [disposition, setDisposition] = useState<AgentWrapUpDisposition>("resolved");
  const [agentNotes, setAgentNotes] = useState("");
  const [outcomeTag, setOutcomeTag] = useState("");
  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [csatEnabled, setCsatEnabled] = useState(false);
  const [csatRequired, setCsatRequired] = useState(false);
  const [csatScaleMax, setCsatScaleMax] = useState(5);

  const payload = formQuery.data;
  const submitted = Boolean(payload?.wrapUpSubmitted);
  const visitorLabel = payload?.visitorPresentation?.displayName || payload?.visitorPresentation?.inboxTitle || "Visitor";

  useEffect(() => {
    if (!payload || !conversationId) return;
    if (payload.requiresDistributionForm) {
      const href = resolveDashboardHref(payload.distributionFormPath ?? "") || `/dashboard/chat-operations/distribution?conversationId=${encodeURIComponent(conversationId)}`;
      router.replace(href as Href);
      return;
    }
    if (payload.requiresDistributionSetup && payload.websiteId) {
      router.replace("/dashboard/chat-operations" as Href);
      return;
    }
    router.replace("/dashboard/chat-operations" as Href);
  }, [conversationId, payload, router]);

  useEffect(() => {
    if (!payload?.closeForm?.prefilledValues) return;
    setValues({ ...payload.closeForm.prefilledValues });
  }, [payload?.closeForm?.prefilledValues]);

  useEffect(() => {
    if (!payload?.websiteId) return;
    let cancelled = false;
    const applyCsatFromOps = (ops: ReturnType<typeof mergeChatOperationsJson>) => {
      const csat = (ops.csat ?? {}) as Record<string, unknown>;
      setCsatEnabled(Boolean(csat.enabled));
      setCsatRequired(Boolean(csat.required));
      setCsatScaleMax(typeof csat.scaleMax === "number" && csat.scaleMax > 0 ? csat.scaleMax : 5);
    };
    if (!canLoadWidgetSettings) {
      applyCsatFromOps(DEFAULT_CHAT_OPERATIONS);
      return;
    }
    void (async () => {
      try {
        const bundle = await fetchWebsiteChatSettings(payload.websiteId!);
        const ops = mergeChatOperationsJson(DEFAULT_CHAT_OPERATIONS, bundle.settings?.operationsJson ?? DEFAULT_CHAT_OPERATIONS);
        if (!cancelled) applyCsatFromOps(ops);
      } catch {
        if (!cancelled) applyCsatFromOps(DEFAULT_CHAT_OPERATIONS);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canLoadWidgetSettings, payload?.websiteId]);

  const visibleFields = useMemo(() => (payload?.closeForm?.fields ?? []).filter((f) => f.enabled || f.isRequired), [payload?.closeForm?.fields]);

  const submitMutation = useMutation({
    mutationFn: () =>
      submitAgentWrapUp(conversationId, {
        disposition,
        agentNotes: agentNotes.trim(),
        ...(outcomeTag.trim() ? { outcomeTag: outcomeTag.trim() } : {}),
        ...(csatEnabled && csatScore != null ? { csatScore } : {}),
        formValues: values,
      } satisfies SubmitAgentWrapUpBody),
  });

  const canSubmit = useMemo(() => {
    if (!agentNotes.trim()) return false;
    if (csatEnabled && csatRequired && csatScore == null) return false;
    return true;
  }, [agentNotes, csatEnabled, csatRequired, csatScore]);

  const handleSubmit = () => {
    if (!canSubmit) {
      publishAppToast({ variant: "error", message: "Add agent notes before submitting." });
      return;
    }
    submitMutation.mutate(undefined, {
      onSuccess: () => {
        publishAppToast({ variant: "success", message: "Wrap-up submitted successfully." });
        router.push("/dashboard/chat-operations" as Href);
      },
      onError: (err) => {
        publishAppToast({ variant: "error", message: extractApiErrorMessageForToast(err, "Wrap-up submission failed.") });
      },
    });
  };

  const dispositionOptions = payload?.form?.dispositionOptions?.length ? payload.form.dispositionOptions : DISPOSITIONS;

  if (!conversationId) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" color={tokens.colors.accentPink}>
            Missing conversation ID.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  if (formQuery.isSuccess && payload && (payload.requiresDistributionForm || payload.requiresDistributionSetup)) {
    return (
      <MobileScreen>
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
          <Typography variant="small" muted style={{ marginTop: tokens.space.sm }}>
            {payload.requiresDistributionForm ? "Redirecting to distribution form…" : "Redirecting…"}
          </Typography>
        </View>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen>
      <Typography variant="regularLarge" style={{ fontWeight: "700", marginBottom: 4 }}>
        Post-close wrap-up · {visitorLabel}
      </Typography>
      <Typography variant="small" muted style={{ marginBottom: tokens.space.lg }}>
        Review the session details below, record disposition and notes, then submit. The chat transcript remains saved in history.
      </Typography>

      {formQuery.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={tokens.colors.accentBlue} />
        </View>
      ) : formQuery.isError ? (
        <Typography variant="medium" color={tokens.colors.accentPink}>
          {extractApiErrorMessageForToast(formQuery.error, "Could not load the post-close form for this chat.")}
        </Typography>
      ) : payload ? (
        <AppCard style={{ gap: tokens.space.md }}>
          {payload.messageCounts ? (
            <Typography variant="small" muted>
              {payload.messageCounts.total} messages · {payload.durationMinutes ?? 0} min session
            </Typography>
          ) : null}

          <ScopeSelectField label="Disposition" value={disposition} onChange={(v) => setDisposition(v as AgentWrapUpDisposition)} options={dispositionOptions} disabled={submitted} />

          <InputField label="Agent notes" value={agentNotes} onChangeText={setAgentNotes} multiline editable={!submitted} maxLength={4000} />

          <InputField label="Outcome tag (optional)" value={outcomeTag} onChangeText={setOutcomeTag} editable={!submitted} />

          {csatEnabled ? (
            <View>
              <Typography variant="small" muted>
                CSAT {csatRequired ? "(required)" : "(optional)"} · 1–{csatScaleMax}
              </Typography>
              <StarRating value={csatScore} max={csatScaleMax} onChange={setCsatScore} disabled={submitted} />
            </View>
          ) : null}

          {visibleFields.length > 0 ? (
            <View style={{ gap: tokens.space.md }}>
              <Typography variant="medium" style={{ fontWeight: "600" }}>
                Session fields
              </Typography>
              {visibleFields.map((field) => (
                <WrapUpFieldInput key={field.fieldKey} field={field} value={values[field.fieldKey] ?? ""} onChange={(v) => setValues((prev) => ({ ...prev, [field.fieldKey]: v }))} readOnly={submitted || field.readOnly} />
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: tokens.space.sm, flexWrap: "wrap" }}>
            <Button variant="secondary" onPress={() => router.back()}>
              Back to inbox
            </Button>
            {!submitted ? (
              <Button variant="primary" disabled={submitMutation.isPending || !canSubmit} onPress={handleSubmit}>
                {submitMutation.isPending ? "Submitting…" : "Submit"}
              </Button>
            ) : (
              <Typography variant="medium" muted style={{ alignSelf: "center" }}>
                Wrap-up already submitted for this chat.
              </Typography>
            )}
          </View>
        </AppCard>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: tokens.space.xl,
  },
});
