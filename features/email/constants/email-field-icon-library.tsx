import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/email/constants/email-field-icon-library.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type renderFieldIconSvg = Record<string, unknown>;
export type EmailFieldIconProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailFieldIcon(props: EmailFieldIconProps) {
  const label = props.title ?? "EmailFieldIcon";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailFieldIconKeyProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailFieldIconKey(props: EmailFieldIconKeyProps) {
  const label = props.title ?? "EmailFieldIconKey";
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
