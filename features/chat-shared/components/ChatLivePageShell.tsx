import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { tokens } from "@/theme/tokens";
import { chatLivePageStack } from "../styles/chat-live.styles";

type ChatLivePageShellVariant = "workstation" | "admin";

type ChatLivePageShellProps = {
  variant?: ChatLivePageShellVariant;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * Workstation = full-bleed triage (inbox / monitor / QA).
 * Admin = standard screen rhythm (settings, reports, canned).
 */
export function ChatLivePageShell({ variant = "admin", style, children }: ChatLivePageShellProps) {
  return (
    <View
      style={[
        chatLivePageStack.root,
        variant === "admin" ? { padding: tokens.space.screen } : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
