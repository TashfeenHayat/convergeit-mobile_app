import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/chat-widget/components/WidgetWizardStepGuide.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WidgetWizardStepGuideProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetWizardStepGuide(props: WidgetWizardStepGuideProps) {
  const label = props.title ?? "WidgetWizardStepGuide";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WidgetWizardGuideStepProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetWizardGuideStep(props: WidgetWizardGuideStepProps) {
  const label = props.title ?? "WidgetWizardGuideStep";
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
