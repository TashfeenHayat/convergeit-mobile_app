import { useMemo, useState } from 'react';
import {
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

import { Label } from '@/components/ui/Label';
import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type SelectFieldOption = {
  label: string;
  value: string;
};

export type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  /** Adds a search field inside the option list modal. Default: true */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Smaller label + tighter spacing (side panels, dense forms). */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = '— Select —',
  disabled = false,
  error = false,
  helperText,
  searchable = true,
  searchPlaceholder,
  dense = false,
  style,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!searchable) return options;
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const openPicker = () => {
    if (disabled) return;
    setQuery('');
    setOpen(true);
  };

  const borderColor = error ? tokens.colors.danger : tokens.colors.inputBorder;

  return (
    <View style={[styles.container, style]}>
      <Label error={error} style={dense ? styles.labelDense : undefined}>
        {label}
      </Label>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={openPicker}
        style={[styles.field, { borderBottomColor: borderColor }, disabled && styles.disabled]}
      >
        <Typography
          variant="medium16"
          color={selected ? tokens.colors.textPrimary : tokens.colors.textPlaceholder}
          style={styles.fieldLabel}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Typography>
        <Ionicons name="chevron-down" size={18} color={tokens.colors.textMuted} />
      </Pressable>
      {helperText ? (
        <Typography variant="small" color={error ? tokens.colors.danger : tokens.colors.textMuted} style={styles.helper}>
          {helperText}
        </Typography>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.cardAnchor} onPress={() => undefined}>
            <LiquidGlass intensity="strong" radius={glassUi.radius.lg} elevated contentStyle={styles.card}>
              <Typography variant="mediumLarge" style={styles.cardTitle}>
                {label}
              </Typography>
              {searchable ? (
                <LiquidGlass intensity="subtle" radius={glassUi.radius.pill} contentStyle={styles.searchRow}>
                  <Ionicons name="search" size={16} color={tokens.colors.textMuted} />
                  <TextInput
                    autoFocus
                    value={query}
                    onChangeText={setQuery}
                    placeholder={searchPlaceholder ?? 'Search…'}
                    placeholderTextColor={tokens.colors.textPlaceholder}
                    style={styles.searchInput}
 />
                </LiquidGlass>
              ) : null}
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.value}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const active = item.value === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      style={[styles.row, active && styles.rowActive]}
                    >
                      <Typography
                        variant="medium"
                        color={active ? tokens.colors.accentBlue : tokens.colors.textPrimary}
                      >
                        {item.label}
                      </Typography>
                      {active ? <Ionicons name="checkmark" size={16} color={tokens.colors.accentBlue} /> : null}
                    </Pressable>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.row}>
                    <Typography variant="small" muted>
                      No options
                    </Typography>
                  </View>
                }
  showsVerticalScrollIndicator={false}/>
            </LiquidGlass>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelDense: {
    marginBottom: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    minHeight: 44,
    gap: tokens.space.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  fieldLabel: {
    flex: 1,
  },
  helper: {
    marginTop: 6,
    minHeight: 16,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 22, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
  },
  cardAnchor: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '70%',
  },
  card: {
    padding: tokens.space.lg,
    maxHeight: '100%',
  },
  cardTitle: {
    marginBottom: tokens.space.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    height: 40,
    marginBottom: tokens.space.md,
  },
  searchInput: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.space.sm + 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowActive: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
