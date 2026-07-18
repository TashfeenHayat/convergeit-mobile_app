import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type FilterableSearchOption = {
  value: string;
  label: string;
};

export type FilterableSearchSuggestion = {
  id: string;
  label: string;
  subtitle?: string;
};

export type FilterableSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  selectValue: string;
  onSelectChange: (value: string) => void;
  selectOptions: FilterableSearchOption[];
  selectedSuggestion?: FilterableSearchSuggestion;
  onSelectedSuggestionChange: (value: FilterableSearchSuggestion | undefined) => void;
  suggestions?: FilterableSearchSuggestion[];
  isSuggestionsLoading?: boolean;
  placeholder?: string;
  searchAriaLabel?: string;
  onEnter?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Simplified mobile port: pill search field + inline scope picker (modal list) + a
 * flat suggestions panel underneath (no portal/ClickAwayListener — RN has no document body).
 */
export function FilterableSearchBar({
  value,
  onChange,
  selectValue,
  onSelectChange,
  selectOptions,
  selectedSuggestion,
  onSelectedSuggestionChange,
  suggestions = [],
  isSuggestionsLoading = false,
  placeholder = 'Search...',
  searchAriaLabel = 'Search input',
  onEnter,
  style,
}: FilterableSearchBarProps) {
  const [focused, setFocused] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasQuery = value.trim().length > 0;
  const showSuggestions = focused && hasQuery;
  const selectedOption = selectOptions.find((o) => o.value === selectValue);

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.shell}>
        <Ionicons name="search" size={18} color={tokens.colors.textMuted} />
        <TextInput
          accessibilityLabel={searchAriaLabel}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onEnter}
          returnKeyType="search"
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textPlaceholder}
          style={styles.input}
        />
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={8}
            onPress={() => {
              onChange('');
              onSelectedSuggestionChange(undefined);
            }}
            style={styles.iconButton}
          >
            <Ionicons name="close" size={16} color={tokens.colors.textMuted} />
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickerOpen(true)}
          style={styles.scopeButton}
        >
          <Typography variant="small" style={styles.scopeLabel}>
            {selectedOption?.label ?? selectValue}
          </Typography>
          <Ionicons name="chevron-down" size={14} color={tokens.colors.textMuted} />
        </Pressable>
      </View>

      {showSuggestions ? (
        <View style={styles.suggestionsPanel}>
          {isSuggestionsLoading ? (
            <View style={styles.suggestionsMessage}>
              <ActivityIndicator size="small" color={tokens.colors.textMuted} />
              <Typography variant="small" color={tokens.colors.textMuted}>
                Loading suggestions...
              </Typography>
            </View>
          ) : suggestions.length === 0 ? (
            <View style={styles.suggestionsMessage}>
              <Typography variant="small" color={tokens.colors.textMuted}>
                No suggestions
              </Typography>
            </View>
          ) : (
            <FlatList
              data={suggestions.slice(0, 8)}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = selectedSuggestion?.id === item.id;
                return (
                  <Pressable
                    onPress={() => {
                      onSelectedSuggestionChange(item);
                      onChange(item.label);
                    }}
                    style={[styles.suggestionRow, active && styles.suggestionRowActive]}
                  >
                    <Typography variant="medium">{item.label}</Typography>
                    {item.subtitle ? (
                      <Typography variant="small" color={tokens.colors.textMuted}>
                        {item.subtitle}
                      </Typography>
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : null}

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerOpen(false)}>
          <View style={styles.modalCard}>
            <FlatList
              data={selectOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelectChange(item.value);
                    onSelectedSuggestionChange(undefined);
                    setPickerOpen(false);
                  }}
                  style={[styles.modalRow, item.value === selectValue && styles.suggestionRowActive]}
                >
                  <Typography variant="medium">{item.label}</Typography>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
  },
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
  iconButton: {
    padding: 2,
  },
  scopeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: tokens.space.sm,
    borderLeftWidth: 1,
    borderLeftColor: tokens.colors.cardBorder,
  },
  scopeLabel: {
    fontWeight: '600',
  },
  suggestionsPanel: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    zIndex: 20,
    maxHeight: 260,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    overflow: 'hidden',
  },
  suggestionsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
  },
  suggestionRow: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.overlayBorder,
  },
  suggestionRowActive: {
    backgroundColor: tokens.colors.pillActive,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: 360,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    overflow: 'hidden',
  },
  modalRow: {
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.overlayBorder,
  },
});
