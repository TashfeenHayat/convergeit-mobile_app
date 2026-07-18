/**
 * RN port of the web `chat-operations.styled.tsx` MUI `styled()` factories.
 * Native has no CSS-in-JS `styled(Box)` equivalent, so each export below is a
 * small RN component built on `View`/`StyleSheet` instead — same names, same
 * roles, used the same way by the chat-operations components.
 */
import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@/theme/tokens";
import { CHAT_OPS_BOX_RADIUS_PX } from "./chat-operations.styles";

type Box = { children?: ReactNode; style?: StyleProp<ViewStyle> };

export function PanelColumn({ children, style }: Box) {
  return <View style={[styles.panelColumn, style]}>{children}</View>;
}

export function PanelHeader({ children, style }: Box) {
  return <View style={[styles.panelHeader, style]}>{children}</View>;
}

export function ScrollRegion({ children, style }: Box) {
  return <View style={[styles.scrollRegion, style]}>{children}</View>;
}

export function QueueAvatar({ children, style }: Box) {
  return <View style={[styles.queueAvatar, style]}>{children}</View>;
}

export function MessageAvatar({ children, ai, style }: Box & { ai?: boolean }) {
  return <View style={[styles.messageAvatar, ai && styles.messageAvatarAi, style]}>{children}</View>;
}

export function MessageAvatarSpacer() {
  return <View style={styles.messageAvatarSpacer} />;
}

export function MessageRowOuter({ children, outgoing, system, style }: Box & { outgoing?: boolean; system?: boolean }) {
  return (
    <View
      style={[
        styles.messageRowOuter,
        outgoing && !system && styles.messageRowOuterOutgoing,
        system && styles.messageRowOuterSystem,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function MessageRow({ children, outgoing, style }: Box & { outgoing?: boolean }) {
  return <View style={[styles.messageRow, outgoing && styles.messageRowOutgoing, style]}>{children}</View>;
}

export function ComposerWrap({ children, style }: Box) {
  return <View style={[styles.composerWrap, style]}>{children}</View>;
}

export function ComposerRow({ children, style }: Box) {
  return <View style={[styles.composerRow, style]}>{children}</View>;
}

export function ComposerInputShell({ children, style }: Box) {
  return <View style={[styles.composerInputShell, style]}>{children}</View>;
}

export function EmptyState({ children, style }: Box) {
  return <View style={[styles.emptyState, style]}>{children}</View>;
}

export function EmptyStateIconRing({ children, style }: Box) {
  return <View style={[styles.emptyStateIconRing, style]}>{children}</View>;
}

export function TypingIndicator({ children, style }: Box) {
  return <View style={[styles.typingIndicator, style]}>{children}</View>;
}

export function ProfileHeroCard({ children, style }: Box) {
  return <View style={[styles.profileHeroCard, style]}>{children}</View>;
}

export function CloseChatPanel({ children, style }: Box) {
  return <View style={[styles.closeChatPanel, style]}>{children}</View>;
}

export function ChatHeaderMetaChip({ children, style }: Box) {
  return <View style={[styles.headerMetaChip, style]}>{children}</View>;
}

export function LocationMapFrame({ children, style }: Box) {
  return <View style={[styles.locationMapFrame, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  panelColumn: {
    flexDirection: "column",
    minHeight: 0,
  },
  panelHeader: {
    paddingVertical: 12,
    paddingHorizontal: tokens.space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(8, 10, 20, 0.55)",
  },
  scrollRegion: {
    flex: 1,
    minHeight: 0,
  },
  queueAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0084FF",
    borderWidth: 0,
    borderColor: "transparent",
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  messageAvatarAi: {
    backgroundColor: "rgba(99, 102, 241, 0.4)",
    borderColor: "rgba(34, 211, 238, 0.35)",
  },
  messageAvatarSpacer: {
    width: 32,
  },
  messageRowOuter: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    width: "100%",
    maxWidth: "92%",
  },
  messageRowOuterOutgoing: {
    alignSelf: "flex-end",
    marginLeft: "auto",
  },
  messageRowOuterSystem: {
    maxWidth: "100%",
    alignSelf: "stretch",
  },
  messageRow: {
    flexDirection: "column",
    flexShrink: 1,
    minWidth: 0,
    gap: 4,
    alignItems: "flex-start",
  },
  messageRowOutgoing: {
    alignItems: "flex-end",
  },
  composerWrap: {
    borderTopWidth: 1,
    borderTopColor: tokens.colors.cardBorder,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.space.sm,
  },
  composerInputShell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    paddingHorizontal: tokens.space.sm,
    paddingVertical: 6,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.space.md,
    padding: tokens.space.xl,
  },
  emptyStateIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99, 102, 241, 0.16)",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  typingIndicator: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 40,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  profileHeroCard: {
    margin: tokens.space.md,
    padding: tokens.space.md,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.3)",
    backgroundColor: "rgba(88, 101, 242, 0.1)",
  },
  closeChatPanel: {
    marginTop: 4,
    padding: tokens.space.md,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  headerMetaChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    minWidth: 56,
  },
  locationMapFrame: {
    height: 160,
    borderRadius: CHAT_OPS_BOX_RADIUS_PX,
    overflow: "hidden",
    backgroundColor: tokens.colors.surface,
  },
});
