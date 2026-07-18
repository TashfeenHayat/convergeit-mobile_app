import { StyleSheet, View } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export const chatReportsStyles = StyleSheet.create({
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.sm,
  },
  kpiCard: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.pillBg,
  },
  section: {
    marginTop: tokens.space.lg,
    gap: tokens.space.sm,
  },
});

export function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={chatReportsStyles.kpiCard}>
      <Typography variant="small" muted>
        {label}
      </Typography>
      <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
        {value}
      </Typography>
    </View>
  );
}
