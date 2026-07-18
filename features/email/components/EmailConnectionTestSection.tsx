import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/email/components/EmailConnectionTestSection.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type EmailConnectionTestSectionProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailConnectionTestSection(props: EmailConnectionTestSectionProps) {
  const label = props.title ?? "EmailConnectionTestSection";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmailTestFeedbackProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmailTestFeedback(props: EmailTestFeedbackProps) {
  const label = props.title ?? "EmailTestFeedback";
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
