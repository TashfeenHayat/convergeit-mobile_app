import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { glassUi } from '@/lib/theme/glass-ui';
import { dialogBackdropColor, hexAlpha, useThemeColors } from '@/lib/theme/use-theme-colors';
import { tokens } from '@/theme/tokens';

export type GlassModalShellProps = {
  children: ReactNode;
  onBackdropPress?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  backdropOpacity?: number;
};

/**
 * Web `ModalGlassShell` + `dialogBackdropBackground` parity (Discord accent glow + glass face).
 */
export function GlassModalShell({
  children,
  onBackdropPress,
  style,
  contentStyle,
  backdropOpacity = 0.42,
}: GlassModalShellProps) {
  const c = useThemeColors();
  const scrim = dialogBackdropColor(c.accentBlue, c.isLight, backdropOpacity);
  const rimBorder = c.isLight ? hexAlpha('#0f172a', 0.16) : 'rgba(255, 255, 255, 0.34)';

  return (
    <Pressable
      style={styles.backdrop}
      onPress={onBackdropPress}
      accessibilityRole="button"
      accessibilityLabel="Dismiss"
    >
      <LinearGradient
        pointerEvents="none"
        colors={
          c.isLight
            ? [hexAlpha(c.accentBlue, 0.12), scrim]
            : [hexAlpha(c.accentBlue, 0.4), scrim]
        }
        locations={c.isLight ? [0, 1] : [0, 0.58]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Pressable style={[styles.anchor, style]} onPress={(e) => e.stopPropagation()}>
        <LiquidGlass
          intensity="strong"
          radius={glassUi.radius.lg}
          elevated
          border={false}
          contentStyle={styles.content}
        >
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.rim, { borderColor: rimBorder }]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={
              c.isLight
                ? ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.38)', 'rgba(248,250,252,0.52)']
                : [
                    'rgba(255,255,255,0.22)',
                    'rgba(255,255,255,0.09)',
                    hexAlpha(c.accentBlue, 0.08),
                  ]
            }
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.body, contentStyle]}>{children}</View>
        </LiquidGlass>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.lg,
  },
  anchor: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
  },
  content: {
    padding: 0,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  rim: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: glassUi.radius.lg,
    zIndex: 2,
  },
  body: {
    position: 'relative',
    zIndex: 3,
    padding: tokens.space.xl,
    maxHeight: '100%',
    flexShrink: 1,
  },
});