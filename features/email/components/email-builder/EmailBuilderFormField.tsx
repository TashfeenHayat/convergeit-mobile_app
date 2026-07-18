import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/email/components/email-builder/EmailBuilderFormField.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type toColorInputValue = Record<string, unknown>;
export type emailBuilderFieldSx = Record<string, unknown>;
export type EmailBuilderInputFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderInputField(props: EmailBuilderInputFieldProps) {
  const label = props.title ?? "EmailBuilderInputField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailBuilderSelectFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderSelectField(props: EmailBuilderSelectFieldProps) {
  const label = props.title ?? "EmailBuilderSelectField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailBuilderColorFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderColorField(props: EmailBuilderColorFieldProps) {
  const label = props.title ?? "EmailBuilderColorField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailBuilderFieldStackProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderFieldStack(props: EmailBuilderFieldStackProps) {
  const label = props.title ?? "EmailBuilderFieldStack";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailBuilderDualFieldGridProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderDualFieldGrid(props: EmailBuilderDualFieldGridProps) {
  const label = props.title ?? "EmailBuilderDualFieldGrid";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailBuilderPairGridProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailBuilderPairGrid(props: EmailBuilderPairGridProps) {
  const label = props.title ?? "EmailBuilderPairGrid";
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
