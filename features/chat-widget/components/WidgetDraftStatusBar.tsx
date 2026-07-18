import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WidgetDraftStatusBarProps = {
  statusLabel?: string | null;
  unpublishedDraft?: boolean;
};

export function WidgetDraftStatusBar({ statusLabel, unpublishedDraft = false }: WidgetDraftStatusBarProps) {
  if (!statusLabel && !unpublishedDraft) return null;
  return (
    <View style={styles.bar}>
      <Typography variant="small" style={{ fontWeight: "600" }}>
        {statusLabel ?? "Draft"}
        {unpublishedDraft ? " · Unpublished changes" : ""}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    backgroundColor: tokens.colors.pillBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
});
