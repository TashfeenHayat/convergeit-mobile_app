import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/chat-settings/components/VisitorTopicsEditor.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type VisitorTopicsEditorProps = Record<string, unknown>;
export type VisitorTopicsEditorProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function VisitorTopicsEditor(props: VisitorTopicsEditorProps) {
  const label = props.title ?? "VisitorTopicsEditor";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type VisitorTopicEditorRowProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function VisitorTopicEditorRow(props: VisitorTopicEditorRowProps) {
  const label = props.title ?? "VisitorTopicEditorRow";
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
