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
  const isDisabled = disabled || loading;
  const variantStyles = variantStyleMap[variant];
  const sizeStyles = size === 'compact' ? styles.compact : styles.defaultSize;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles,
        variantStyles.idle,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outlined' || variant === 'ghost' ? tokens.colors.accentBlue : '#fff'}
        />
      ) : typeof children === 'string' ? (
        <Typography
          variant="button"
          color={variantStyles.labelColor}
          style={styles.label}
        >
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

const variantStyleMap: Record<
  ButtonVariant,
  { idle: ViewStyle; pressed: ViewStyle; labelColor: string }
> = {
  primary: {
    idle: {
      backgroundColor: tokens.colors.accentBlue,
    },
    pressed: {
      backgroundColor: tokens.colors.accentBlueDark,
    },
    labelColor: tokens.colors.textPrimary,
  },
  secondary: {
    idle: {
      backgroundColor: tokens.colors.pillBg,
      borderWidth: 1,
      borderColor: tokens.colors.cardBorder,
    },
    pressed: {
      backgroundColor: tokens.colors.pillActive,
    },
    labelColor: tokens.colors.textPrimary,
  },
  outlined: {
    idle: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: tokens.colors.cardBorder,
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    labelColor: tokens.colors.textPrimary,
  },
  danger: {
    idle: {
      backgroundColor: tokens.colors.danger,
    },
    pressed: {
      backgroundColor: '#DC2626',
    },
    labelColor: tokens.colors.textPrimary,
  },
  ghost: {
    idle: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    labelColor: tokens.colors.accentBlue,
  },
};
