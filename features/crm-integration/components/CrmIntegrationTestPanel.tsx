import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/crm-integration/components/CrmIntegrationTestPanel.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type CrmIntegrationTestPanelProps = Record<string, unknown>;
export type CrmIntegrationTestPanelHandleProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CrmIntegrationTestPanelHandle(props: CrmIntegrationTestPanelHandleProps) {
  const label = props.title ?? "CrmIntegrationTestPanelHandle";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type CrmIntegrationTestSubmitStateProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CrmIntegrationTestSubmitState(props: CrmIntegrationTestSubmitStateProps) {
  const label = props.title ?? "CrmIntegrationTestSubmitState";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type CrmIntegrationTestPanelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CrmIntegrationTestPanel(props: CrmIntegrationTestPanelProps) {
  const label = props.title ?? "CrmIntegrationTestPanel";
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
