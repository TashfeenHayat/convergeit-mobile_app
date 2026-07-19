import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import {
  authOnGlassText,
  useAuthOnGlass,
} from '@/components/auth/AuthOnGlassContext';
import { useAppTheme } from '@/theme';
import { tokens } from '@/theme/tokens';

export type TypographyVariant =
  | 'medium'
  | 'medium16'
  | 'mediumLarge'
  | 'small'
  | 'boldLarge'
  | 'regularLarge'
  | 'button'
  | 'label';

export type TypographyProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: string;
  muted?: boolean;
};

export function Typography({
  variant = 'medium',
  color,
  muted = false,
  style,
  children,
  ...rest
}: TypographyProps) {
  const theme = useAppTheme();
  const onGlass = useAuthOnGlass();
  const variantStyle = tokens.typography[variant];
  const resolvedColor =
    color ??
    (onGlass
      ? muted
        ? authOnGlassText.secondary
        : authOnGlassText.primary
      : muted
        ? theme.app.text.secondary
        : theme.app.text.primary);

  return (
    <RNText
      style={[styles.base, variantStyle, { color: resolvedColor }, style]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
  },
});
