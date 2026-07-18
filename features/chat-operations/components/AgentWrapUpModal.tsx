import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { FormModal, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ScopeSelectField } from "@/features/chat-shared";
import { submitAgentWrapUp } from "@/services/chat/wrap-up.api";
import type { AgentWrapUpDisposition, AgentWrapUpPayload, SubmitAgentWrapUpBody } from "@/services/chat/wrap-up.types";
import { useAuth } from "@/lib/auth";
import { canWidgetSettingsFromArrays } from "@/lib/permissions/chat-access";
import { DEFAULT_CHAT_OPERATIONS, mergeChatOperationsJson } from "@/services/chat/chat-settings.defaults";
import { fetchWebsiteChatSettings } from "@/services/chat/chat-settings.api";

const DISPOSITIONS: Array<{ value: AgentWrapUpDisposition; label: string }> = [
  { value: "resolved", label: "Resolved" },
  { value: "pending_follow_up", label: "Pending follow-up" },
  { value: "no_response", label: "No response" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

interface AgentWrapUpModalProps {
  open: boolean;
  payload: AgentWrapUpPayload | null;
  onClose: () => void;
  onSubmitted: () => void;
}

function StarRating({ value, max, onChange }: { value: number | null; max: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={4}>
          <Ionicons
            name={value != null && star <= value ? "star" : "star-outline"}
            size={26}
            color={value != null && star <= value ? tokens.colors.accentOrange : tokens.colors.textMuted}
          />
        </Pressable>
      ))}
    </View>
  );
}

export function AgentWrapUpModal({ open, payload, onClose, onSubmitted }: AgentWrapUpModalProps) {
  const { pagePermissions, operationalPermissions, isPlatformAdmin } = useAuth();
  const canLoadWidgetSettings = canWidgetSettingsFromArrays({
    page: pagePermissions,
    operational: operationalPermissions,
    isPlatformAdmin,
  });
  const [disposition, setDisposition] = useState<AgentWrapUpDisposition>("resolved");
  const [agentNotes, setAgentNotes] = useState("");
  const [outcomeTag, setOutcomeTag] = useState("");
  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [csatEnabled, setCsatEnabled] = useState(false);
  const [csatRequired, setCsatRequired] = useState(false);
  const [csatScaleMax, setCsatScaleMax] = useState(5);

  const title = payload?.visitorPresentation?.displayName || payload?.visitorPresentation?.inboxTitle || "Visitor";

  useEffect(() => {
    if (!open || !payload?.websiteId) return;
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
  }, [canLoadWidgetSettings, open, payload?.websiteId]);

  useEffect(() => {
    if (!open) {
      setDisposition("resolved");
      setAgentNotes("");
      setOutcomeTag("");
      setCsatScore(null);
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!agentNotes.trim()) return false;
    if (csatEnabled && csatRequired && csatScore == null) return false;
    return true;
  }, [agentNotes, csatEnabled, csatRequired, csatScore]);

  const handleSubmit = async () => {
    if (!payload?.conversationId || !canSubmit) return;
    setSubmitting(true);
    try {
      const body: SubmitAgentWrapUpBody = {
        disposition,
        agentNotes: agentNotes.trim(),
        ...(outcomeTag.trim() ? { outcomeTag: outcomeTag.trim() } : {}),
        ...(csatEnabled && csatScore != null ? { csatScore } : {}),
      };
      await submitAgentWrapUp(payload.conversationId, body);
      onSubmitted();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const dispositionOptions = payload?.form?.dispositionOptions?.length ? payload.form.dispositionOptions : DISPOSITIONS;

  return (
    <FormModal
      open={open}
      onClose={() => !submitting && onClose()}
      onSave={() => void handleSubmit()}
      title={`Wrap-up · ${title}`}
      description={payload?.hint || "This chat is complete. Submit disposition and notes — history stays saved."}
      primaryButtonLabel={submitting ? "Submitting…" : "Submit wrap-up"}
      primaryButtonDisabled={!canSubmit || submitting}
      cancelButtonLabel="Skip for now"
    >
      <View style={{ gap: tokens.space.md }}>
        {payload?.messageCounts ? (
          <Typography variant="small" muted>
            {payload.messageCounts.total} messages · {payload.durationMinutes ?? 0} min
          </Typography>
        ) : null}

        <ScopeSelectField
          label="Disposition"
          value={disposition}
          onChange={(v) => setDisposition(v as AgentWrapUpDisposition)}
          options={dispositionOptions}
        />

        <InputField label="Agent notes" value={agentNotes} onChangeText={setAgentNotes} multiline maxLength={4000} />

        <InputField label="Outcome tag (optional)" value={outcomeTag} onChangeText={setOutcomeTag} />

        {csatEnabled ? (
          <View>
            <Typography variant="small" muted>
              CSAT {csatRequired ? "(required)" : "(optional)"} · 1–{csatScaleMax}
            </Typography>
            <StarRating value={csatScore} max={csatScaleMax} onChange={setCsatScore} />
          </View>
        ) : null}
      </View>
    </FormModal>
  );
}