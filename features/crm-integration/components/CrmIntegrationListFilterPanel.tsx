import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/crm-integration/components/CrmIntegrationListFilterPanel.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type CrmIntegrationListFilterPanelProps = Record<string, unknown>;
export type CrmIntegrationListFilterPanelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CrmIntegrationListFilterPanel(props: CrmIntegrationListFilterPanelProps) {
  const label = props.title ?? "CrmIntegrationListFilterPanel";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type CRM_PLATFORM_FILTER_OPTIONSProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function CRM_PLATFORM_FILTER_OPTIONS(props: CRM_PLATFORM_FILTER_OPTIONSProps) {
  const label = props.title ?? "CRM_PLATFORM_FILTER_OPTIONS";
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
