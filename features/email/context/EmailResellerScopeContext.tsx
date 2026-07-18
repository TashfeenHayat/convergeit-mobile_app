import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/email/context/EmailResellerScopeContext.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type useEmailResellerScope = Record<string, unknown>;
export type EmailResellerScopeProviderProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailResellerScopeProvider(props: EmailResellerScopeProviderProps) {
  const label = props.title ?? "EmailResellerScopeProvider";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailResellerScopeProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailResellerScope(props: EmailResellerScopeProps) {
  const label = props.title ?? "EmailResellerScope";
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
