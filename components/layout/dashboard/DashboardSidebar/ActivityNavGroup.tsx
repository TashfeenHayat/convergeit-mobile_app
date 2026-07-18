import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ActivityNavGroupProps = {
  title?: string;
  children?: ReactNode;
};

/** Section header + children for activity nav clusters (drawer uses its own rows). */
export function ActivityNavGroup({ title, children }: ActivityNavGroupProps) {
  return (
    <View style={styles.group}>
      {title ? (
        <Typography variant="small" color={tokens.colors.textMuted} style={styles.title}>
          {title}
        </Typography>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: tokens.space.xs,
    paddingVertical: tokens.space.sm,
  },
  title: {
    paddingHorizontal: tokens.space.md,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontSize: 11,
  },
});
