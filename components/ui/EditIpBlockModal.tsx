import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/common/EditIpBlockModal/EditIpBlockModal.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type EditIpBlockModalProps = Record<string, unknown>;
export type EditIpBlockModalProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EditIpBlockModal(props: EditIpBlockModalProps) {
  const label = props.title ?? "EditIpBlockModal";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EditIpBlockSavePayloadProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EditIpBlockSavePayload(props: EditIpBlockSavePayloadProps) {
  const label = props.title ?? "EditIpBlockSavePayload";
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
