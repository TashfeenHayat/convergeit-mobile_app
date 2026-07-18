import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/common/DeleteUserConfirmModal/DeleteUserConfirmModal.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type DeleteUserConfirmModalProps = Record<string, unknown>;
export type DeleteUserConfirmModalProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DeleteUserConfirmModal(props: DeleteUserConfirmModalProps) {
  const label = props.title ?? "DeleteUserConfirmModal";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type USER_DELETE_CONFIRMATION_TOKENProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function USER_DELETE_CONFIRMATION_TOKEN(props: USER_DELETE_CONFIRMATION_TOKENProps) {
  const label = props.title ?? "USER_DELETE_CONFIRMATION_TOKEN";
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
