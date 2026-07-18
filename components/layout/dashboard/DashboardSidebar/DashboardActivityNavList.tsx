import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { tokens } from "@/theme/tokens";

/**
 * Activity nav list container — drawer layout owns live nav; this is a parity shell.
 */
export function DashboardActivityNavList({ children }: { children?: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

const styles = StyleSheet.create({
  list: {
    gap: tokens.space.xs,
  },
});
