import { StyleSheet } from "react-native";
import { tokens } from "@/theme/tokens";

export const chatQaStyles = StyleSheet.create({
  shell: { flex: 1, minHeight: 0 },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.sm,
  },
  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    backgroundColor: tokens.colors.pillBg,
  },
  queuePane: { flex: 1, minHeight: 0 },
  queueHeader: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
    gap: tokens.space.sm,
  },
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  tabActive: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: "rgba(88,101,242,0.14)",
  },
  queueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  queueRowSelected: { backgroundColor: "rgba(88,101,242,0.08)" },
  reviewBanner: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  reviewPanel: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.colors.border,
  },
  contextPanel: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
    backgroundColor: tokens.colors.pillBg,
    borderRadius: tokens.radius.md,
    margin: tokens.space.md,
  },
});

export default chatQaStyles;
