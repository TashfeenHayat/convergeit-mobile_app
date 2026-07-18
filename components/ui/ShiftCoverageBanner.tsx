import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/common/ShiftCoverageBanner/ShiftCoverageBanner.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ShiftCoverageBannerProps = Record<string, unknown>;
export type ShiftCoverageBannerProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function ShiftCoverageBanner(props: ShiftCoverageBannerProps) {
  const label = props.title ?? "ShiftCoverageBanner";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type ShiftCoverageOkHintProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function ShiftCoverageOkHint(props: ShiftCoverageOkHintProps) {
  const label = props.title ?? "ShiftCoverageOkHint";
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
