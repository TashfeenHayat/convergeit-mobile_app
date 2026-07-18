import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { tokens } from '@/theme/tokens';

export type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchBar({ value, onChange, placeholder = 'Search anything..', style }: SearchBarProps) {
  return (
    <View style={[styles.shell, style]}>
      <Ionicons name="search" size={18} color={tokens.colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.textPlaceholder}
        style={styles.input}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChange('')}
          style={styles.clearButton}
        >
          <Ionicons name="close" size={16} color={tokens.colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    height: 44,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  input: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  clearButton: {
    padding: 2,
  },
});
