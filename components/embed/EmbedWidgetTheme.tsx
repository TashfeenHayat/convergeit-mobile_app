import type { ReactNode } from "react";
import { View, StyleSheet, type ViewStyle } from "react-native";

import { tokens } from "@/theme/tokens";

export type EmbedWidgetThemeProps = {
  children?: ReactNode;
  style?: ViewStyle;
};

/** Lightweight theme wrapper for embed preview surfaces. */
export function EmbedWidgetTheme({ children, style }: EmbedWidgetThemeProps) {
  return <View style={[styles.shell, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.colors.surface,
  },
});
