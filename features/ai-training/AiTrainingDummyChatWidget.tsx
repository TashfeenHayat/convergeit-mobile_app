import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/ai-training/AiTrainingDummyChatWidget.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type AiTrainingDummyChatWidgetProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function AiTrainingDummyChatWidget(props: AiTrainingDummyChatWidgetProps) {
  const label = props.title ?? "AiTrainingDummyChatWidget";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type TestChatTurnProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function TestChatTurn(props: TestChatTurnProps) {
  const label = props.title ?? "TestChatTurn";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type DummyChatTurnProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function DummyChatTurn(props: DummyChatTurnProps) {
  const label = props.title ?? "DummyChatTurn";
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
