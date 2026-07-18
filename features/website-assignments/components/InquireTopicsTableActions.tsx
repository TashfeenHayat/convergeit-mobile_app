import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/website-assignments/components/InquireTopicsTableActions.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type InquireTopicsTableActionsProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function InquireTopicsTableActions(props: InquireTopicsTableActionsProps) {
  const label = props.title ?? "InquireTopicsTableActions";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type InquireTopicsRowActionProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function InquireTopicsRowAction(props: InquireTopicsRowActionProps) {
  const label = props.title ?? "InquireTopicsRowAction";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
});
