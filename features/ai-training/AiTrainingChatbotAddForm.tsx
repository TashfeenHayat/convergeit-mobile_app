import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/ai-training/AiTrainingChatbotAddForm.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type AiTrainingChatbotAddFormProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function AiTrainingChatbotAddForm(props: AiTrainingChatbotAddFormProps) {
  const label = props.title ?? "AiTrainingChatbotAddForm";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type ChatbotTrainingMethodProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function ChatbotTrainingMethod(props: ChatbotTrainingMethodProps) {
  const label = props.title ?? "ChatbotTrainingMethod";
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
