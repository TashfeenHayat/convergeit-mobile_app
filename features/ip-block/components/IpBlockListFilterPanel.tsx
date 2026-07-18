import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/ip-block/components/IpBlockListFilterPanel.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type IpBlockListFilterPanelProps = Record<string, unknown>;
export type IpBlockListFilterPanelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function IpBlockListFilterPanel(props: IpBlockListFilterPanelProps) {
  const label = props.title ?? "IpBlockListFilterPanel";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type IP_BLOCK_STATUS_FILTER_OPTIONSProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function IP_BLOCK_STATUS_FILTER_OPTIONS(props: IP_BLOCK_STATUS_FILTER_OPTIONSProps) {
  const label = props.title ?? "IP_BLOCK_STATUS_FILTER_OPTIONS";
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
