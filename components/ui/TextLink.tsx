import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type TextLinkProps = PressableProps & {
  children: string;
  color?: string;
};

export function TextLink({
  children,
  color = tokens.colors.accentBlue,
  style,
  ...rest
}: TextLinkProps) {
  return (
    <Pressable accessibilityRole="link" hitSlop={6} {...rest}>
      {({ pressed }) => (
        <Typography
          variant="medium"
          color={color}
          style={[styles.link, pressed && styles.pressed, style as object]}
        >
          {children}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.75,
  },
});
