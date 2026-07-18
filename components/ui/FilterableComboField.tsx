import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Label } from '@/components/ui/Label';
import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type FilterableComboOption = {
  value: string;
  label: string;
  /** Shown in list but not selectable (e.g. loading / hint rows). */
  disabled?: boolean;
};

export type FilterableComboFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterableComboOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Shown when the typed query matches nothing. */
  noMatchesMessage?: string;
  /** Max height of the suggestion panel (px). */
  listMaxHeight?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Type-to-filter field aligned with {@link FilterableSearchBar}: pill input + suggestion panel.
 * Simplified mobile version — no ClickAwayListener; panel closes on selection or blur.
 */
export function FilterableComboField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Type to filter…',
  disabled = false,
  noMatchesMessage = 'No matches',
  listMaxHeight = 260,
  style,
}: FilterableComboFieldProps) {
  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value && !o.disabled)?.label ?? '',
    [options, value],
  );
  const [draft, setDraft] = useState(selectedLabel);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, draft]);

  const pick = (opt: FilterableComboOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setDraft(opt.label);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setDraft('');
    setOpen(false);
  };

  return (
    <View style={[styles.container, style]}>
      <Label>{label}</Label>
      <View style={[styles.shell, disabled && styles.disabled]}>
        <Ionicons name="search" size={18} color={tokens.colors.textMuted} />
        <TextInput
          editable={!disabled}
          value={draft}
          onChangeText={(next) => {
            setDraft(next);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setDraft(selectedLabel);
          }}
          placeholder={placeholder}
          placeholderTextColor={tokens.colors.textPlaceholder}
          style={styles.input}
        />
        {draft.trim().length > 0 && !disabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Clear ${label}`}
            hitSlop={8}
            onPress={clear}
            style={styles.clearButton}
          >
            <Ionicons name="close" size={16} color={tokens.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {open && !disabled ? (
        <View style={[styles.panel, { maxHeight: listMaxHeight }]}>
          {filtered.length === 0 ? (
            <View style={styles.panelMessage}>
              <Typography variant="small" color={tokens.colors.textMuted}>
                {noMatchesMessage}
              </Typography>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => `${item.value}:${item.label}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value && !item.disabled;
                return (
                  <Pressable
                    disabled={item.disabled}
                    onPress={() => pick(item)}
                    style={[
                      styles.panelRow,
                      active && styles.panelRowActive,
                      item.disabled && styles.panelRowDisabled,
                    ]}
                  >
                    <Typography variant="medium">{item.label}</Typography>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    minHeight: 44,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.pillBg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  disabled: {
    opacity: 0.55,
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
  panel: {
    marginTop: tokens.space.sm,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    overflow: 'hidden',
  },
  panelMessage: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.md,
  },
  panelRow: {
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.overlayBorder,
  },
  panelRowActive: {
    backgroundColor: tokens.colors.pillActive,
  },
  panelRowDisabled: {
    opacity: 0.6,
  },
});
