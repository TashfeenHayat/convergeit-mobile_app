/**
 * React Native port shell — source: converge_saas_frontend/features/ai-training/ai-flow-builder.icons.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type flowNodeIcon = Record<string, unknown>;
export const flowNodeIcon = {} as const;
const styles = StyleSheet.create({
  shell: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
});
