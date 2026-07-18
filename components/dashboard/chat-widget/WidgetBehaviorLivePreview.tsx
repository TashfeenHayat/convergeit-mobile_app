import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/dashboard/chat-widget/WidgetBehaviorLivePreview.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type WidgetBehaviorLivePreviewProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function WidgetBehaviorLivePreview(props: WidgetBehaviorLivePreviewProps) {
  const label = props.title ?? "WidgetBehaviorLivePreview";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type BehaviorPreviewTabProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function BehaviorPreviewTab(props: BehaviorPreviewTabProps) {
  const label = props.title ?? "BehaviorPreviewTab";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type BehaviorLivePreviewModelProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function BehaviorLivePreviewModel(props: BehaviorLivePreviewModelProps) {
  const label = props.title ?? "BehaviorLivePreviewModel";
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
