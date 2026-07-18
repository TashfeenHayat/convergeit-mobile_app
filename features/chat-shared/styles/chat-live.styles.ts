import { StyleSheet } from "react-native";
import { tokens } from "@/theme/tokens";

/**
 * RN port — source used MUI `sx` objects keyed by theme. Native screens consume
 * plain `StyleSheet` objects instead; kept the same export names so imports
 * across the chat-* features keep working.
 */
export const chatLivePageStack = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    gap: tokens.space.md,
  },
});

export const chatLiveHeaderCard = StyleSheet.create({
  root: {
    paddingBottom: tokens.space.md,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
});

export const chatLiveNavStrip = StyleSheet.create({
  scroll: {
    marginTop: tokens.space.sm,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  link: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  linkActive: {
    borderBottomColor: tokens.colors.accentBlue,
  },
});

export const chatLiveViewSwitch = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.space.lg,
    marginTop: tokens.space.sm,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  btn: {
    paddingBottom: tokens.space.sm,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  btnActive: {
    borderBottomColor: tokens.colors.accentBlue,
  },
});

export const chatLiveScopeChip = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: tokens.colors.accentBlue,
    backgroundColor: "rgba(88, 101, 242, 0.12)",
  },
});

export const chatLiveQueueStatPill = StyleSheet.create({
  active: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: "rgba(88, 101, 242, 0.12)",
  },
  waiting: {
    borderColor: tokens.colors.accentOrange,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
  },
  closed: {
    borderColor: tokens.colors.textMuted,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
  },
});

/** @deprecated Kept for barrel compatibility — configure-page tabs now use `SegmentedControl`. */
export const chatConfigurePageTabsSx = {} as const;
