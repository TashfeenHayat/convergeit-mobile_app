import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export function WidgetPublishStatusChip({ label, isLive }: { label: string; isLive?: boolean }) {
  return (
    <View style={[styles.chip, isLive ? styles.live : styles.draft]}>
      <Typography variant="small" style={{ fontSize: 11, fontWeight: "600" }}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
  },
  live: {
    backgroundColor: "rgba(34,197,94,0.14)",
    borderColor: "rgba(34,197,94,0.28)",
  },
  draft: {
    backgroundColor: "rgba(148,163,184,0.14)",
    borderColor: "rgba(148,163,184,0.28)",
  },
});
