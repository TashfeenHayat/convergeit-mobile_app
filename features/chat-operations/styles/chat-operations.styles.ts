import { StyleSheet } from "react-native";
import { tokens } from "@/theme/tokens";

/** Soft Messenger-style corners for mobile chat chrome. */
export const CHAT_OPS_BOX_RADIUS_PX = 16;

/** Compact inbox: rows before the FlatList scrolls (mobile shows one pane at a time). */
export const CHAT_OPS_QUEUE_ROW_HEIGHT_PX = 76;

export const chatOps = StyleSheet.create({
  pageWrapper: {
    flex: 1,
    minHeight: 0,
  },
  workspaceShell: {
    flex: 1,
    minHeight: 0,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    overflow: "hidden",
  },
  inboxToolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  paneTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  paneSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  alertBanner: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  inboxTabsRow: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  inboxTab: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    alignItems: "center",
  },
  inboxTabActive: {
    backgroundColor: "rgba(88, 101, 242, 0.22)",
  },
  connectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
});
