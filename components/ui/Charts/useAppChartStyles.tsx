/**
 * React Native port shell — source: converge_saas_frontend/components/common/Charts/useAppChartStyles.ts
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type useAppChartStyles = Record<string, unknown>;
export const useAppChartStyles = {} as const;
const styles = StyleSheet.create({
  shell: {
    padding: tokens.space.md,
    gap: tokens.space.sm,
  },
});
