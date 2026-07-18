import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/distribution-setup/components/DistributionSetupTestPanel.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type DistributionSetupTestPanelProps = Record<string, unknown>;
export type DistributionSetupTestDepartmentProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionSetupTestDepartment(props: DistributionSetupTestDepartmentProps) {
  const label = props.title ?? "DistributionSetupTestDepartment";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DistributionSetupTestPanelHandleProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionSetupTestPanelHandle(props: DistributionSetupTestPanelHandleProps) {
  const label = props.title ?? "DistributionSetupTestPanelHandle";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DistributionTestSendStateProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionTestSendState(props: DistributionTestSendStateProps) {
  const label = props.title ?? "DistributionTestSendState";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DistributionSetupTestPanelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionSetupTestPanel(props: DistributionSetupTestPanelProps) {
  const label = props.title ?? "DistributionSetupTestPanel";
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
