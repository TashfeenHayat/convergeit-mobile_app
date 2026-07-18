import type { ComponentProps } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
  Pressable,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { tokens } from '@/theme/tokens';

export type SocialProvider = 'google' | 'github' | 'facebook';

export type SocialAuthButtonProps = Omit<PressableProps, 'style'> & {
  provider: SocialProvider;
  style?: StyleProp<ViewStyle>;
};

const icons: Record<SocialProvider, ComponentProps<typeof FontAwesome>['name']> = {
  google: 'google',
  github: 'github',
  facebook: 'facebook',
};

const labels: Record<SocialProvider, string> = {
  google: 'Continue with Google',
  github: 'Continue with GitHub',
  facebook: 'Continue with Facebook',
};

export function SocialAuthButton({
  provider,
  style,
  ...rest
}: SocialAuthButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={labels[provider]}
      style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
      {...rest}
    >
      <FontAwesome name={icons[provider]} size={20} color={tokens.colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: tokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: tokens.colors.overlayBorder,
  },
  pressed: {
    opacity: 0.85,
  },
});
