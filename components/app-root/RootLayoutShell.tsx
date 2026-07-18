import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { tokens } from "@/theme/tokens";

export type RootLayoutShellProps = {
  children?: ReactNode;
};

/** Full-bleed app shell container (web HTML/body chrome is N/A on RN). */
export function RootLayoutShell({ children }: RootLayoutShellProps) {
  return <View style={styles.shell}>{children}</View>;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: tokens.colors.backgroundBottom,
  },
});
