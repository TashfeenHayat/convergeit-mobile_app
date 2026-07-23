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

import { glassUi } from "@/lib/theme/glass-ui";
import { resolveRnCardFill } from "@/lib/theme/rn-surface";
import { useThemeColors } from "@/lib/theme/use-theme-colors";
import { tokens } from "@/theme/tokens";

export type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Mirrors web `DashboardCard`:
 * - Discord default: dark glass over page gradient + `cardBorder` rim
 * - Nitro / solid presets: themed `cardBg` tint
 */
export function AppCard({ children, style }: AppCardProps) {
  const c = useThemeColors();
  const useBlur = Platform.OS === "ios";
  const themedSolid =
    typeof c.cardBg === "string" &&
    !c.cardBg.includes("gradient") &&
    !c.cardBg.includes("blur(");
  const fill = themedSolid
    ? resolveRnCardFill(c.cardBg, c.surface || c.headerBg, c.isLight)
    : c.isLight
      ? "rgba(255, 255, 255, 0.88)"
      : "rgba(8, 12, 22, 0.78)";

  return (
    <View style={[styles.shadow, { borderRadius: glassUi.radius.lg }]}>
      <View
        style={[
          styles.shell,
          {
            borderRadius: glassUi.radius.lg,
            borderColor: c.cardBorder,
            backgroundColor: fill,
          },
        ]}
      >
        {useBlur ? (
          <BlurView
            intensity={c.isLight ? 28 : 40}
            tint={c.isLight ? "light" : "dark"}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, { backgroundColor: fill }]}
        />
        {/* Web DashboardCard sheen */}
        <LinearGradient
          pointerEvents="none"
          colors={
            c.isLight
              ? ["rgba(255,255,255,0.45)", "rgba(255,255,255,0.08)"]
              : ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.02)"]
          }
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.inner, style]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: glassUi.shadowSoft,
  shell: {
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  inner: {
    position: "relative",
    zIndex: 1,
    padding: tokens.space.xl,
  },
});
