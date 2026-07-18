import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, SelectField, StatusChip, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { QaReviewBundle, UpsertQaSessionReviewBody } from "@/services/chat/qa.types";
import { qaUserDisplay, serviceChannelLabel } from "../utils/qa-user-display";
import { chatQaStyles } from "../styles/chat-qa.styles";
import { QaSessionReviewModal } from "./QaSessionReviewModal";

type AssignOption = { id: string; label: string };

interface QaSessionReviewPanelProps {
  bundle: QaReviewBundle | null;
  canEdit: boolean;
  canAssign: boolean;
  currentUserId?: string | null;
  rosterAssignOptions?: AssignOption[];
  onSave: (body: UpsertQaSessionReviewBody) => Promise<void>;
  onClaim: () => Promise<void>;
  onAssignTo?: (qaUserId: string) => Promise<void>;
  saving?: boolean;
}

export function QaSessionReviewPanel({
  bundle,
  canEdit,
  canAssign,
  rosterAssignOptions = [],
  onSave,
  onClaim,
  onAssignTo,
  saving = false,
}: QaSessionReviewPanelProps) {
  const review = bundle?.review ?? null;
  const summary = bundle?.sessionSummary ?? null;
  const [assignToId, setAssignToId] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  if (!bundle) {
    return (
      <View style={chatQaStyles.reviewPanel}>
        <Typography variant="small" muted>
          Select a chat from the queue to review the transcript and submit a QA report.
        </Typography>
      </View>
    );
  }

  const isCompleted = review?.status === "completed";
  const status = review?.status ?? "pending";
  const slaDue = review?.slaDueAt ? new Date(review.slaDueAt) : null;
  const slaOverdue = slaDue && slaDue.getTime() < Date.now() && !isCompleted;

  return (
    <View style={chatQaStyles.reviewPanel}>
      <View style={styles.row}>
        <StatusChip label={status.replace(/_/g, " ")} tone={isCompleted ? "success" : "warning"} />
        {slaOverdue ? <StatusChip label="SLA overdue" tone="danger" /> : null}
      </View>
      {summary?.website?.label ? (
        <Typography variant="small" muted>
          {summary.website.label}
          {summary.primaryAgent ? ` · ${qaUserDisplay(summary.primaryAgent)}` : ""}
          {summary.serviceChannel ? ` · ${serviceChannelLabel(summary.serviceChannel)}` : ""}
        </Typography>
      ) : null}

      {!isCompleted && canEdit && review?.status === "pending" ? (
        <Button variant="secondary" onPress={() => void onClaim()} disabled={saving}>
          Take review
        </Button>
      ) : null}

      {canAssign && onAssignTo && rosterAssignOptions.length > 0 && !isCompleted ? (
        <View style={styles.assignRow}>
          <SelectField
            label="Assign to"
            value={assignToId}
            onChange={setAssignToId}
            options={[
              { value: "", label: "Select QA reviewer…" },
              ...rosterAssignOptions.map((o) => ({ value: o.id, label: o.label })),
            ]}
          />
          <Button
            variant="secondary"
            size="compact"
            disabled={!assignToId.trim() || saving}
            onPress={() => void onAssignTo(assignToId)}
          >
            Assign
          </Button>
        </View>
      ) : null}

      <Button variant="primary" onPress={() => setReviewModalOpen(true)} disabled={!canEdit && !isCompleted}>
        {isCompleted ? "View QA report" : "Open review form"}
      </Button>

      <QaSessionReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        bundle={bundle}
        canEdit={canEdit}
        saving={saving}
        onSave={onSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm },
  assignRow: { gap: tokens.space.sm },
});
