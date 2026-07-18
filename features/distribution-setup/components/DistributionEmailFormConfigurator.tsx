import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/distribution-setup/components/DistributionEmailFormConfigurator.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type DistributionEmailFormConfiguratorProps = Record<string, unknown>;
export type DistributionEmailFormConfiguratorProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DistributionEmailFormConfigurator(props: DistributionEmailFormConfiguratorProps) {
  const label = props.title ?? "DistributionEmailFormConfigurator";
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
