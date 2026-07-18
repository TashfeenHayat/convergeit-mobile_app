import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/distribution-setup/components/DistributionListFilterPanel.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type DistributionListFilterPanelProps = Record<string, unknown>;
export type DistributionListFilterPanelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionListFilterPanel(props: DistributionListFilterPanelProps) {
  const label = props.title ?? "DistributionListFilterPanel";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DISTRIBUTION_STATUS_FILTER_OPTIONSProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DISTRIBUTION_STATUS_FILTER_OPTIONS(props: DISTRIBUTION_STATUS_FILTER_OPTIONSProps) {
  const label = props.title ?? "DISTRIBUTION_STATUS_FILTER_OPTIONS";
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
