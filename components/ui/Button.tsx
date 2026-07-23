import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { hexAlpha, useThemeColors } from '@/lib/theme/use-theme-colors';
import { tokens } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'danger' | 'ghost';
export type ButtonSize = 'default' | 'compact';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Theme-driven button — mirrors web `Button.styles.ts` (primary / secondary / outlined / danger). */
export function Button({
  children,
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  ...rest
}: ButtonProps) {
  const c = useThemeColors();
  const isDisabled = disabled || loading;
  const sizeStyles = size === 'compact' ? styles.compact : styles.defaultSize;

  const variantStyles: Record<
    ButtonVariant,
    { idle: ViewStyle; pressed: ViewStyle; labelColor: string; spinnerColor: string }
  > = {
    primary: {
      idle: { backgroundColor: c.accentBlue },
      pressed: { backgroundColor: c.accentBlueDark },
      labelColor: c.textPrimary,
      spinnerColor: '#fff',
    },
    secondary: {
      idle: {
        backgroundColor: c.pillBg,
        borderWidth: 1,
        borderColor: c.cardBorder,
      },
      pressed: { backgroundColor: c.pillActive },
      labelColor: c.textPrimary,
      spinnerColor: c.accentBlue,
    },
    outlined: {
      idle: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: c.cardBorder,
      },
      pressed: {
        backgroundColor: c.isLight ? hexAlpha('#0f172a', 0.04) : 'rgba(255,255,255,0.04)',
      },
      labelColor: c.textPrimary,
      spinnerColor: c.accentBlue,
    },
    danger: {
      idle: {
        backgroundColor: c.accentRed,
        borderWidth: 1,
        borderColor: hexAlpha(c.accentRed, 0.55),
      },
      pressed: { backgroundColor: hexAlpha(c.accentRed, 0.88) },
      labelColor: '#FFFFFF',
      spinnerColor: '#fff',
    },
    ghost: {
      idle: { backgroundColor: 'transparent' },
      pressed: {
        backgroundColor: c.isLight ? hexAlpha('#0f172a', 0.06) : 'rgba(255,255,255,0.06)',
      },
      labelColor: c.accentBlue,
      spinnerColor: c.accentBlue,
    },
  };

  const current = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        current.idle,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && current.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={current.spinnerColor} />
      ) : typeof children === 'string' ? (
        <Typography variant="button" color={current.labelColor} style={styles.label}>
          {children}
        </Typography>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: tokens.space.sm,
  },
  defaultSize: {
    paddingVertical: 10,
    paddingHorizontal: 26,
    minWidth: 140,
  },
  compact: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    minWidth: 112,
  },
  fullWidth: {
    width: '100%',
    minWidth: 0,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    textAlign: 'center',
  },
});
