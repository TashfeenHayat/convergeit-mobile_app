import { StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export function WidgetPublishStatusChip({
  label,
  isLive,
}: {
  label: string;
  isLive?: boolean;
}) {
  const pending = label.toLowerCase().includes("pending");
  const tone = pending ? "pending" : isLive ? "live" : "draft";

  return (
    <View
      style={[
        styles.chip,
        tone === "live"
          ? styles.live
          : tone === "pending"
            ? styles.pending
            : styles.draft,
      ]}
    >
      <Typography
        variant="small"
        style={[
          styles.label,
          tone === "live"
            ? styles.liveText
            : tone === "pending"
              ? styles.pendingText
              : styles.draftText,
        ]}
      >
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  live: {
    backgroundColor: "rgba(34,197,94,0.14)",
    borderColor: "rgba(34,197,94,0.28)",
  },
  liveText: {
    color: "#4ADE80",
  },
  pending: {
    backgroundColor: "rgba(249,115,22,0.14)",
    borderColor: "rgba(249,115,22,0.35)",
  },
  pendingText: {
    color: "#FB923C",
  },
  draft: {
    backgroundColor: "rgba(148,163,184,0.14)",
    borderColor: "rgba(148,163,184,0.28)",
  },
  draftText: {
    color: "#94A3B8",
  },
});
