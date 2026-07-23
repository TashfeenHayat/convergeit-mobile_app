import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export type LiquidGlassIntensity = 'subtle' | 'medium' | 'strong';

export type LiquidGlassProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: LiquidGlassIntensity;
  sheen?: boolean;
  border?: boolean;
  radius?: number;
  elevated?: boolean;
  /** Force blur tint; defaults from app palette mode. */
  tint?: 'dark' | 'light' | 'default';
};

const INTENSITY: Record<
  LiquidGlassIntensity,
  { blur: number; fillDark: string; fillLight: string; borderDark: string; borderLight: string; shellDark: string; shellLight: string }
> = {
  subtle: {
    blur: 28,
    fillDark: 'rgba(255, 255, 255, 0.10)',
    fillLight: 'rgba(255, 255, 255, 0.42)',
    borderDark: glassUi.border.subtle,
    borderLight: 'rgba(255, 255, 255, 0.55)',
    shellDark: 'rgba(18, 22, 48, 0.82)',
    shellLight: 'rgba(248, 250, 252, 0.88)',
  },
  medium: {
    blur: 40,
    fillDark: 'rgba(255, 255, 255, 0.14)',
    fillLight: 'rgba(255, 255, 255, 0.50)',
    borderDark: glassUi.border.light,
    borderLight: 'rgba(255, 255, 255, 0.65)',
    shellDark: 'rgba(18, 22, 48, 0.88)',
    shellLight: 'rgba(255, 255, 255, 0.92)',
  },
  strong: {
    blur: 56,
    fillDark: 'rgba(255, 255, 255, 0.18)',
    fillLight: 'rgba(255, 255, 255, 0.58)',
    borderDark: 'rgba(255, 255, 255, 0.38)',
    borderLight: 'rgba(255, 255, 255, 0.72)',
    shellDark: 'rgba(22, 26, 54, 0.92)',
    shellLight: 'rgba(255, 255, 255, 0.95)',
  },
};

function wantsFlexFill(style: StyleProp<ViewStyle> | undefined): boolean {
  const flat = StyleSheet.flatten(style);
  return flat?.flex === 1 || flat?.flexGrow === 1;
}

export function LiquidGlass({
  children,
  style,
  contentStyle,
  intensity = 'medium',
  sheen = true,
  border = true,
  radius = glassUi.radius.md,
  elevated = false,
  tint: tintProp,
}: LiquidGlassProps) {
  const theme = useAppTheme();
  const { paletteMode, app } = theme;
  const preset = INTENSITY[intensity];
  const isLight = (tintProp ?? (paletteMode === 'light' ? 'light' : 'dark')) === 'light';
  const tint = tintProp ?? (isLight ? 'light' : 'dark');
  const fill = isLight ? preset.fillLight : preset.fillDark;
  /** Theme surface — Discord glass when dark; colored headerBg for nitro presets. */
  const themedShellDark =
    app.dashboard.headerBg && app.dashboard.headerBg !== '#1e1f22'
      ? app.dashboard.headerBg
      : 'rgba(8, 12, 22, 0.82)';
  const themedShellLight = app.dashboard.headerBg || preset.shellLight;
  const shellBg = isLight ? themedShellLight : themedShellDark;
  const borderColor = border
    ? app.dashboard.cardBorder || (isLight ? preset.borderLight : preset.borderDark)
    : 'transparent';
  /** iOS blur is reliable; Android Expo Go often paints black with BlurView — use solid glass instead. */
  const useBlur = Platform.OS === 'ios';
  const shellFills = wantsFlexFill(style);
  const contentFills = wantsFlexFill(contentStyle);

  return (
    <View style={[elevated && glassUi.shadowSoft, style]}>
      <View
        style={[
          styles.shell,
          shellFills && styles.fill,
          {
            borderRadius: radius,
            borderColor: border ? borderColor : 'transparent',
            borderWidth: border ? StyleSheet.hairlineWidth * 2 : 0,
            backgroundColor: shellBg,
          },
        ]}
      >
        {useBlur ? (
          <BlurView intensity={preset.blur} tint={tint} style={StyleSheet.absoluteFillObject} />
        ) : null}
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: isLight ? fill : 'rgba(0,0,0,0.22)',
            },
          ]}
        />
        {sheen ? (
          <LinearGradient
            pointerEvents="none"
            colors={
              isLight
                ? ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'transparent']
                : ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.04)', 'transparent']
            }
            locations={[0, 0.35, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        <View style={[styles.content, contentFills && styles.fill, contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
