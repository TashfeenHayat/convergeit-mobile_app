import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { tokens } from "@/theme/tokens";

export type GlassCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Classic glassmorphism card — soft frosted fill, edge sheen highlights.
 * Reusable shell; size/padding come from `style` / `contentStyle`.
 */
export function GlassCard({ children, style, contentStyle }: GlassCardProps) {
  const useBlur = Platform.OS === "ios";

  return (
    <View style={[styles.shadow, style]}>
      <View style={styles.shell}>
        {useBlur ? (
          <BlurView
            intensity={5}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, styles.fill]}
        />

        {/* Top edge highlight (::before) */}
        <LinearGradient
          pointerEvents="none"
          colors={["transparent", "rgba(255, 255, 255, 0.8)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topSheen}
        />

        {/* Left edge highlight (::after) */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255, 255, 255, 0.8)",
            "transparent",
            "rgba(255, 255, 255, 0.3)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.leftSheen}
        />

        <View style={[styles.content, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 6 },
    default: {},
  }),
  shell: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  fill: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  topSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 2,
  },
  leftSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1,
    bottom: 0,
    zIndex: 2,
  },
  content: {
    position: "relative",
    zIndex: 1,
    padding: tokens.space.xl,
  },
});
