import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { FormModal, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { MessageQaAnnotation, UpsertQaMessageAnnotationBody } from "@/services/chat/qa.types";

interface QaMessageAnnotationDialogProps {
  open: boolean;
  messagePreview: string;
  existing: MessageQaAnnotation | null;
  onClose: () => void;
  onSave: (body: UpsertQaMessageAnnotationBody) => Promise<void>;
  saving?: boolean;
}

export function QaMessageAnnotationDialog({
  open,
  messagePreview,
  existing,
  onClose,
  onSave,
  saving = false,
}: QaMessageAnnotationDialogProps) {
  const [rating, setRating] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(existing?.rating != null ? String(existing.rating) : "");
    setTagsText((existing?.tags ?? []).join(", "));
    setComment(existing?.comment ?? "");
  }, [open, existing]);

  const handleSave = async () => {
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const ratingNum = rating.trim() ? Number(rating) : null;
    await onSave({
      ...(ratingNum != null && !Number.isNaN(ratingNum) ? { rating: ratingNum } : {}),
      ...(tags.length ? { tags } : {}),
      ...(comment.trim() ? { comment: comment.trim() } : {}),
    });
    onClose();
  };

  const previewText = messagePreview.length > 400 ? `${messagePreview.slice(0, 400)}…` : messagePreview;

  return (
    <FormModal
      open={open}
      title="Message annotation"
      description="Rate and comment on this message for the QA review."
      onClose={() => !saving && onClose()}
      onSave={() => void handleSave()}
      primaryButtonLabel={saving ? "Saving…" : "Save annotation"}
      primaryButtonDisabled={saving}
    >
      <View style={styles.body}>
        <Typography variant="small" muted style={styles.preview}>
          {previewText}
        </Typography>
        <InputField label="Rating (1–5)" value={rating} onChangeText={setRating} keyboardType="numeric" />
        <InputField label="Tags (comma-separated)" value={tagsText} onChangeText={setTagsText} />
        <InputField
          label="Comment"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
        />
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  body: { gap: tokens.space.md },
  preview: {
    padding: tokens.space.sm,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.pillBg,
    lineHeight: 18,
  },
});
