import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/ip-block/components/IpBlockWebsiteMultiSelect.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type IpBlockWebsiteMultiSelectProps = Record<string, unknown>;
export type IpBlockWebsiteMultiSelectProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function IpBlockWebsiteMultiSelect(props: IpBlockWebsiteMultiSelectProps) {
  const label = props.title ?? "IpBlockWebsiteMultiSelect";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type WebsiteOptionProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WebsiteOption(props: WebsiteOptionProps) {
  const label = props.title ?? "WebsiteOption";
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
