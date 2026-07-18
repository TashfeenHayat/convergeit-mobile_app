import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/website-assignments/components/WebsiteAssignmentFlowStepper.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WebsiteAssignmentFlowStepperProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WebsiteAssignmentFlowStepper(props: WebsiteAssignmentFlowStepperProps) {
  const label = props.title ?? "WebsiteAssignmentFlowStepper";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WebsiteAssignmentFlowStepProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WebsiteAssignmentFlowStep(props: WebsiteAssignmentFlowStepProps) {
  const label = props.title ?? "WebsiteAssignmentFlowStep";
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
