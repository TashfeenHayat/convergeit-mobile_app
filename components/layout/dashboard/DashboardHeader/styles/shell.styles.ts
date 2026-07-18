import { StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

/** Shared header chrome tokens for dashboard header controls. */
export const dashboardHeaderStyles = StyleSheet.create({
  circleIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  shell: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    backgroundColor: tokens.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.overlayBorder,
  },
});

export const styles = dashboardHeaderStyles;
export default styles;
