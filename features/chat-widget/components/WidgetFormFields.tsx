import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/chat-widget/components/WidgetFormFields.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WidgetTextFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetTextField(props: WidgetTextFieldProps) {
  const label = props.title ?? "WidgetTextField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WidgetUrlFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetUrlField(props: WidgetUrlFieldProps) {
  const label = props.title ?? "WidgetUrlField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WidgetDomainListFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetDomainListField(props: WidgetDomainListFieldProps) {
  const label = props.title ?? "WidgetDomainListField";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WidgetNumericFieldProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetNumericField(props: WidgetNumericFieldProps) {
  const label = props.title ?? "WidgetNumericField";
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
