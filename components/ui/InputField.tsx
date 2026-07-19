import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    TextInput,
    View,
    type StyleProp,
    type TextInputProps,
    type ViewStyle,
} from "react-native";

import {
  authOnGlassText,
  useAuthOnGlass,
} from "@/components/auth/AuthOnGlassContext";
import { Typography } from "@/components/ui/Typography";
import { tokens } from "@/theme/tokens";

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
  const onGlass = useAuthOnGlass();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = Boolean(secureTextEntry);
  const borderColor = error
    ? tokens.colors.danger
    : focused
      ? tokens.colors.accentBlue
      : onGlass
        ? authOnGlassText.border
        : tokens.colors.inputBorder;
  const labelColor = error
    ? tokens.colors.danger
    : onGlass
      ? authOnGlassText.primary
      : tokens.colors.textPrimary;
  const inputColor = onGlass ? authOnGlassText.primary : tokens.colors.textPrimary;
  const placeholderColor = onGlass
    ? authOnGlassText.placeholder
    : tokens.colors.textPlaceholder;
  const iconColor = onGlass
    ? authOnGlassText.secondary
    : tokens.colors.textSecondary;
  const helperColor = error
    ? tokens.colors.danger
    : onGlass
      ? authOnGlassText.secondary
      : tokens.colors.textMuted;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Typography variant="label" color={labelColor} style={styles.label}>
          {label}
        </Typography>
      ) : null}
      <View style={[styles.field, { borderBottomColor: borderColor }]}>
        <TextInput
          placeholderTextColor={placeholderColor}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: inputColor }, style]}
          {...rest}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showPassword ? "Hide password" : "Show password"
            }
            hitSlop={8}
            onPress={() => setShowPassword((v) => !v)}
            style={styles.eye}
          >
            <FontAwesome
              name={showPassword ? "eye-slash" : "eye"}
              size={18}
              color={iconColor}
            />
          </Pressable>
        ) : null}
      </View>
      {helperText ? (
        <Typography variant="small" color={helperColor} style={styles.helper}>
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    minHeight: 44,
  },
  input: {
    flex: 1,
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
