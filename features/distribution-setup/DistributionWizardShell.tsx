import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/distribution-setup/DistributionWizardShell.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type DistributionWizardShellProps = Record<string, unknown>;
export type DistributionWizardShellProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionWizardShell(props: DistributionWizardShellProps) {
  const label = props.title ?? "DistributionWizardShell";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DistributionWizardStepProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionWizardStep(props: DistributionWizardStepProps) {
  const label = props.title ?? "DistributionWizardStep";
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
