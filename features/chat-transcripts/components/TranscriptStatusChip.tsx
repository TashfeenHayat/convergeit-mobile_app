import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { TranscriptListItem } from "@/services/chat/transcript.types";
import {
  CLOSED_CHAT_BUCKETS,
  isMeaningfulClosedChat,
  isSpamCloseOutcome,
  resolveClosedChatBucket,
  spamCategoryLabel,
} from "@/features/chat-operations/utils/chat-close-outcome";

function resolveLabel(
  row: Pick<
    TranscriptListItem,
    | "transcriptStatus"
    | "status"
    | "closeBucket"
    | "closeOutcome"
    | "spamCategory"
    | "requiresDistributionForm"
    | "requiresDistributionSetup"
    | "distributionSubmitted"
    | "isMeaningfulChat"
  >,
): string {
  const fromApi = row.transcriptStatus?.trim();
  if (fromApi) {
    if (fromApi.toLowerCase() === "live") {
      const s = row.status?.toLowerCase();
      if (s === "assigned") return "Assigned";
      if (s === "waiting") return "Waiting";
      if (s === "active") return "Active";
    }
    return fromApi;
  }

  const status = row.status?.trim().toLowerCase();
  if (status && status !== "closed") {
    if (status === "assigned") return "Assigned";
    if (status === "waiting") return "Waiting";
    if (status === "active") return "Active";
    return row.status?.trim() || "—";
  }

  if (status === "closed") {
    const bucket = resolveClosedChatBucket({
      closeBucket: row.closeBucket,
      closeOutcome: row.closeOutcome,
      requiresDistributionForm: Boolean(row.requiresDistributionForm),
      requiresDistributionSetup: Boolean(row.requiresDistributionSetup),
      distributionSubmitted: Boolean(row.distributionSubmitted),
      isMeaningfulChat: Boolean(row.isMeaningfulChat),
    });
    if (bucket === CLOSED_CHAT_BUCKETS.SPAM) {
      const cat = spamCategoryLabel(row.spamCategory);
      return cat && cat !== "Spam" ? `Spam · ${cat}` : "Spam";
    }
    if (bucket === CLOSED_CHAT_BUCKETS.PENDING) return "Form pending";
    if (bucket === CLOSED_CHAT_BUCKETS.COMPLETED) {
      return isMeaningfulClosedChat(row) ? "Meaningful chat" : "Closed";
    }
    if (isSpamCloseOutcome(row.closeOutcome)) return "Spam";
    return "Closed";
  }

  return row.status?.trim() || "—";
}

function chipStyle(label: string, status: string) {
  const hay = label.toLowerCase();
  if (hay.startsWith("spam")) {
    return { bg: "rgba(251, 191, 36, 0.14)", color: tokens.colors.accentOrange, border: "rgba(251, 191, 36, 0.28)" };
  }
  if (hay.includes("form pending") || hay === "pending") {
    return { bg: "rgba(56, 189, 248, 0.14)", color: tokens.colors.accentCyan, border: "rgba(56, 189, 248, 0.28)" };
  }
  if (hay.includes("meaningful") || hay === "complete" || hay.includes("form complete")) {
    return { bg: "rgba(34, 197, 94, 0.14)", color: tokens.colors.accentGreen, border: "rgba(34, 197, 94, 0.28)" };
  }
  const s = status.toLowerCase();
  if (s === "active" || s === "assigned") {
    return { bg: "rgba(34, 197, 94, 0.12)", color: tokens.colors.accentGreen, border: "rgba(34, 197, 94, 0.28)" };
  }
  if (s === "waiting") {
    return { bg: "rgba(34, 211, 238, 0.12)", color: tokens.colors.accentCyan, border: "rgba(34, 211, 238, 0.28)" };
  }
  if (s === "closed") {
    return { bg: "rgba(148, 163, 184, 0.12)", color: tokens.colors.textMuted, border: "rgba(148, 163, 184, 0.28)" };
  }
  return { bg: "rgba(88, 101, 242, 0.12)", color: tokens.colors.accentBlue, border: "rgba(88, 101, 242, 0.28)" };
}

type Props = {
  row: Pick<
    TranscriptListItem,
    | "transcriptStatus"
    | "status"
    | "closeBucket"
    | "closeOutcome"
    | "spamCategory"
    | "requiresDistributionForm"
    | "requiresDistributionSetup"
    | "distributionSubmitted"
    | "isMeaningfulChat"
  >;
};

export function TranscriptStatusChip({ row }: Props) {
  const label = resolveLabel(row);
  const chip = chipStyle(label, row.status ?? "");

  return (
    <View style={[styles.chip, { backgroundColor: chip.bg, borderColor: chip.border }]}>
      <Typography variant="small" style={{ fontSize: 11, fontWeight: "600", color: chip.color }}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
});
