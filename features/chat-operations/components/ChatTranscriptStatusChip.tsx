import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { CLOSED_CHAT_BUCKETS, isSpamCloseOutcome, resolveClosedChatBucket } from "../utils/chat-close-outcome";

type Props = {
  conversationMeta?: Record<string, unknown> | null;
  readOnly?: boolean;
  visitorTyping?: boolean;
};

export function resolveLiveStatusChipLabel(input: {
  readOnly?: boolean;
  visitorTyping?: boolean;
  conversationMeta?: Record<string, unknown> | null;
}): string {
  if (!input.readOnly) {
    return input.visitorTyping ? "Typing" : "Online";
  }
  const bucket = resolveClosedChatBucket({
    closeBucket: typeof input.conversationMeta?.closeBucket === "string" ? input.conversationMeta.closeBucket : null,
    closeOutcome: typeof input.conversationMeta?.closeOutcome === "string" ? input.conversationMeta.closeOutcome : null,
    requiresDistributionForm: Boolean(input.conversationMeta?.requiresDistributionForm),
    distributionSubmitted: Boolean(input.conversationMeta?.distributionSubmitted),
  });
  if (bucket === CLOSED_CHAT_BUCKETS.SPAM) return "Spam";
  if (bucket === CLOSED_CHAT_BUCKETS.PENDING) return "Form pending";
  if (bucket === CLOSED_CHAT_BUCKETS.COMPLETED) {
    if (Boolean(input.conversationMeta?.isMeaningfulChat) || Boolean(input.conversationMeta?.distributionSubmitted)) {
      return "Meaningful chat";
    }
    return "Closed";
  }
  return "Closed";
}

export function ChatTranscriptStatusChip({ conversationMeta, readOnly = false, visitorTyping = false }: Props) {
  const label = resolveLiveStatusChipLabel({ readOnly, visitorTyping, conversationMeta });
  const isLive = !readOnly;
  const closeFields = {
    closeBucket: typeof conversationMeta?.closeBucket === "string" ? conversationMeta.closeBucket : null,
    closeOutcome: typeof conversationMeta?.closeOutcome === "string" ? conversationMeta.closeOutcome : null,
    requiresDistributionForm: Boolean(conversationMeta?.requiresDistributionForm),
    distributionSubmitted: Boolean(conversationMeta?.distributionSubmitted),
  };
  const isSpam = readOnly && (isSpamCloseOutcome(closeFields.closeOutcome) || resolveClosedChatBucket(closeFields) === CLOSED_CHAT_BUCKETS.SPAM);
  const bucket = readOnly ? resolveClosedChatBucket(closeFields) : null;

  const color = isLive
    ? visitorTyping
      ? "#22D3EE"
      : tokens.colors.accentGreen
    : isSpam
      ? tokens.colors.accentOrange
      : bucket === CLOSED_CHAT_BUCKETS.PENDING
        ? tokens.colors.accentBlue
        : bucket === CLOSED_CHAT_BUCKETS.COMPLETED
          ? tokens.colors.accentGreen
          : tokens.colors.textMuted;

  return (
    <View style={[styles.chip, { borderColor: `${color}47`, backgroundColor: `${color}24` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Typography variant="small" color={color} style={{ fontWeight: "600" }}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    height: 22,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
