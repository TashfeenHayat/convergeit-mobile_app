import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type InputFieldProps = TextInputProps & {
  label?: string;
  error?: boolean;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function InputField({
  label,
  error = false,
  helperText,
  containerStyle,
  secureTextEntry,
  style,
  ...rest
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = Boolean(secureTextEntry);
  const borderColor = error
    ? tokens.colors.danger
    : focused
      ? tokens.colors.accentBlue
      : tokens.colors.inputBorder;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Typography
          variant="label"
          color={error ? tokens.colors.danger : tokens.colors.textPrimary}
          style={styles.label}
        >
          {label}
        </Typography>
      ) : null}
      <View style={[styles.field, { borderBottomColor: borderColor }]}>
        <TextInput
          placeholderTextColor={tokens.colors.textPlaceholder}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, style]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={8}
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eye}
          >
            <FontAwesome
              name={showPassword ? 'eye-slash' : 'eye'}
              size={18}
              color={tokens.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>
      {helperText ? (
        <Typography
          variant="small"
          color={error ? tokens.colors.danger : tokens.colors.textMuted}
          style={styles.helper}
        >
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    minHeight: 44,
  },
  input: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  eye: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  helper: {
    marginTop: 6,
    minHeight: 16,
  },
});
