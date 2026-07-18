import { Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { tokens } from "@/theme/tokens";

export type ThemeSwatchButtonProps = {
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  /** Solid fallback or gradient start color */
  previewBar: string;
  previewTab?: string;
  shape?: "tile" | "circle";
  compact?: boolean;
};

export function ThemeSwatchButton({
  selected,
  onPress,
  accessibilityLabel,
  previewBar,
  previewTab,
  shape = "tile",
  compact = false,
}: ThemeSwatchButtonProps) {
  const isCircle = shape === "circle";
  const size = compact ? 44 : isCircle ? 52 : 56;
  const radius = isCircle ? size / 2 : 12;

  const colors = previewTab ? ([previewBar, previewTab] as const) : ([previewBar, previewBar] as const);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.root,
        {
          width: isCircle ? size : compact ? 72 : 88,
          height: size,
          borderRadius: radius,
          borderColor: selected ? tokens.colors.accentBlue : tokens.colors.cardBorder,
          borderWidth: selected ? 2.5 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius - 1, overflow: "hidden" }]}
      />
      {selected ? <View style={[styles.checkRing, { borderRadius: radius }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { overflow: "hidden", position: "relative" },
  checkRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
});
