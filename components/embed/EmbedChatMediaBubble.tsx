import type { ReactNode } from "react";
/**
 * React Native port shell — source: converge_saas_frontend/components/embed/EmbedChatMediaBubble.tsx
 * Public exports preserved so the mobile tree mirrors web 1:1.
 * Replace shell UI with full RN layout as the feature is productized.
 */
import { View, StyleSheet } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type EmbedChatMediaBubbleProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmbedChatMediaBubble(props: EmbedChatMediaBubbleProps) {
  const label = props.title ?? "EmbedChatMediaBubble";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmbedChatVideoBubbleProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmbedChatVideoBubble(props: EmbedChatVideoBubbleProps) {
  const label = props.title ?? "EmbedChatVideoBubble";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmbedChatBannerBubbleProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmbedChatBannerBubble(props: EmbedChatBannerBubbleProps) {
  const label = props.title ?? "EmbedChatBannerBubble";
  return (
    <View style={styles.shell} accessibilityLabel={label}>
      <Typography variant="medium">{label}</Typography>
      {props.children}
    </View>
  );
}

export type EmbedChatMediaBubblesProps = {
  children?: ReactNode;
  title?: string;
  [key: string]: unknown;
};

export function EmbedChatMediaBubbles(props: EmbedChatMediaBubblesProps) {
  const label = props.title ?? "EmbedChatMediaBubbles";
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
