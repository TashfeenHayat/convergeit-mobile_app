import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { tokens } from '@/theme/tokens';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  onSubmit?: () => void;
};

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search anything...',
  style,
  onSubmit,
}: SearchBarProps) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.shell,
        {
          backgroundColor: c.isLight
            ? c.overlayLight || c.pillBg
            : c.surfaceElevated || c.pillBg || 'rgba(255,255,255,0.08)',
          borderColor: c.inputBorder || c.cardBorder,
        },
        style,
      ]}
    >
      <Ionicons name="search" size={18} color={c.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textPlaceholder}
        style={[styles.input, { color: c.textPrimary }]}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        clearButtonMode="never"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChange('')}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color={c.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 0,
    minWidth: 0,
  },
  clearButton: {
    padding: 2,
  },
});
