import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    Pressable,
    StyleSheet,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

import {
  authOnGlassText,
  useAuthOnGlass,
} from "@/components/auth/AuthOnGlassContext";
import { Typography } from "@/components/ui/Typography";
import { tokens } from "@/theme/tokens";

export type CheckboxProps = {
  checked: boolean;
  onChange?: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  style,
}: CheckboxProps) {
  const onGlass = useAuthOnGlass();
  const boxBorder = onGlass ? authOnGlassText.border : tokens.colors.border;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange?.(!checked)}
      style={[styles.row, disabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.box,
          { borderColor: boxBorder },
          checked && styles.boxChecked,
        ]}
      >
        {checked ? (
          <FontAwesome
            name="check"
            size={12}
            color={tokens.colors.textPrimary}
          />
        ) : null}
      </View>
      {label ? (
        <Typography variant="medium" style={styles.label}>
          {label}
        </Typography>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  boxChecked: {
    backgroundColor: tokens.colors.accentBlue,
    borderColor: tokens.colors.accentBlue,
  },
  label: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});
