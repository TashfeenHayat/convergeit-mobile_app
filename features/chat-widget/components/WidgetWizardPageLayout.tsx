import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/features/chat-widget/components/WidgetWizardPageLayout.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WidgetWizardPageLayoutProps = Record<string, unknown>;
export type WidgetWizardPageLayoutProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetWizardPageLayout(props: WidgetWizardPageLayoutProps) {
  const label = props.title ?? "WidgetWizardPageLayout";
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
