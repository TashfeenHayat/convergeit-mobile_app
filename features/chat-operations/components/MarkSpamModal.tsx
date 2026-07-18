import { useState } from "react";
import { View } from "react-native";
import { FormModal, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ScopeSelectField } from "@/features/chat-shared";
import { SPAM_CATEGORIES, type SpamCategoryValue } from "../utils/chat-close-outcome";

export type MarkSpamModalProps = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (input: { spamCategory: SpamCategoryValue; notes: string }) => void;
};

export function MarkSpamModal({ open, busy = false, onClose, onConfirm }: MarkSpamModalProps) {
  const [category, setCategory] = useState<SpamCategoryValue>("promotional");
  const [notes, setNotes] = useState("");

  const notesRequired = category === "other";

  const handleConfirm = () => {
    if (notesRequired && !notes.trim()) return;
    onConfirm({ spamCategory: category, notes: notes.trim() });
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSave={handleConfirm}
      title="Mark as spam"
      description="This ends the chat immediately. No distribution form will be required. A spam record is saved with your reason."
      primaryButtonLabel={busy ? "Saving…" : "Confirm spam"}
      primaryButtonDisabled={busy || (notesRequired && !notes.trim())}
      cancelButtonLabel="Cancel"
      primaryButtonVariant="danger"
    >
      <View style={{ gap: tokens.space.md }}>
        <ScopeSelectField
          label="Why is this spam?"
          value={category}
          onChange={(v) => setCategory(v as SpamCategoryValue)}
          options={SPAM_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <InputField
          label={notesRequired ? "Additional notes" : "Additional notes (optional)"}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Brief context for reporting and audit…"
        />
        <Typography variant="small" muted>
          Spam chats appear only in the Spam queue — not in Pending form.
        </Typography>
      </View>
    </FormModal>
  );
}
