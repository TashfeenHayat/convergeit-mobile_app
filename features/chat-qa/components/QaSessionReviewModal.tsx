import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Checkbox, FormModal, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { QaReviewBundle, UpsertQaSessionReviewBody } from "@/services/chat/qa.types";
import {
  buildQaSessionReviewBody,
  QA_SESSION_CHECKLIST_KEYS,
  readQaChecklist,
} from "../utils/qa-session-review.shared";

interface QaSessionReviewModalProps {
  open: boolean;
  onClose: () => void;
  bundle: QaReviewBundle | null;
  canEdit: boolean;
  saving?: boolean;
  onSave: (body: UpsertQaSessionReviewBody) => Promise<void>;
}

export function QaSessionReviewModal({
  open,
  onClose,
  bundle,
  canEdit,
  saving = false,
  onSave,
}: QaSessionReviewModalProps) {
  const review = bundle?.review ?? null;
  const [starRating, setStarRating] = useState("3");
  const [failureReason, setFailureReason] = useState("");
  const [overallScore, setOverallScore] = useState("80");
  const [summaryText, setSummaryText] = useState("");
  const [coachingNotes, setCoachingNotes] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [meaningfulChat, setMeaningfulChat] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!review) {
      setStarRating("3");
      setFailureReason("");
      setOverallScore("80");
      setSummaryText("");
      setCoachingNotes("");
      setChecklist(readQaChecklist(null));
      setMeaningfulChat(false);
      return;
    }
    setStarRating(review.starRating != null ? String(review.starRating) : "");
    setFailureReason(review.failureReason ?? "");
    setOverallScore(review.overallScore != null ? String(review.overallScore) : "80");
    setSummaryText(review.summary ?? "");
    setCoachingNotes(review.coachingNotes ?? "");
    setChecklist(readQaChecklist(review.checklistJson ?? null));
  }, [open, review]);

  if (!bundle) return null;

  const isCompleted = review?.status === "completed";
  const readOnly = !canEdit || isCompleted;

  const formFields = {
    starRating: starRating.trim() ? Number(starRating) : null,
    failureReason,
    overallScore: Number(overallScore) || 80,
    summary: summaryText,
    coachingNotes,
    checklist,
    meaningfulChat,
  };

  return (
    <FormModal
      open={open}
      title={isCompleted ? "QA report (submitted)" : "QA session review"}
      description="Score this closed chat and submit the QA report."
      onClose={() => !saving && onClose()}
      onSave={() => {
        if (readOnly) {
          onClose();
          return;
        }
        void onSave(buildQaSessionReviewBody("completed", formFields)).then(onClose);
      }}
      primaryButtonLabel={readOnly ? "Close" : saving ? "Submitting…" : "Submit report"}
      primaryButtonDisabled={saving}
    >
      <View style={styles.form}>
        <InputField label="Star rating (1–5)" value={starRating} onChangeText={setStarRating} keyboardType="numeric" editable={!readOnly} />
        <InputField label="Overall score" value={overallScore} onChangeText={setOverallScore} keyboardType="numeric" editable={!readOnly} />
        <InputField label="Failure reason" value={failureReason} onChangeText={setFailureReason} editable={!readOnly} />
        <InputField label="Summary" value={summaryText} onChangeText={setSummaryText} multiline editable={!readOnly} />
        <InputField label="Coaching notes" value={coachingNotes} onChangeText={setCoachingNotes} multiline editable={!readOnly} />
        {QA_SESSION_CHECKLIST_KEYS.map((item) => (
          <Checkbox
            key={item.key}
            label={item.label}
            checked={Boolean(checklist[item.key])}
            onChange={(v) => setChecklist((prev) => ({ ...prev, [item.key]: v }))}
            disabled={readOnly}
          />
        ))}
        {!readOnly ? (
          <Checkbox label="Meaningful chat" checked={meaningfulChat} onChange={setMeaningfulChat} />
        ) : null}
        {!readOnly && !isCompleted ? (
          <Button
            variant="secondary"
            disabled={saving}
            onPress={() => void onSave(buildQaSessionReviewBody("in_progress", formFields))}
          >
            Save progress
          </Button>
        ) : null}
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  form: { gap: tokens.space.md },
});
