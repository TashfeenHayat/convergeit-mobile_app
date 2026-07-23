import { useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Typography } from '@/components/ui/Typography';
import {
  formatNationalForCountry,
  formatPhoneWithCountry,
  getPhoneValidationError,
  parsePhoneInputValue,
} from '@/lib/ui/format-phone-input';
import {
  DEFAULT_PHONE_COUNTRY_ISO,
  PHONE_COUNTRIES,
  getPhoneCountryByIso,
  type PhoneCountry,
} from '@/lib/ui/phone-countries';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';
import { useAppTheme } from '@/theme';

export type PhoneInputFieldProps = {
  label?: string;
  value: string;
  onChangeText: (formatted: string) => void;
  onValidationChange?: (error: string | null) => void;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  defaultCountryIso?: string;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  validateLive?: boolean;
};

export function PhoneInputField({
  label = 'Phone',
  value,
  onChangeText,
  onValidationChange,
  required = false,
  error = false,
  helperText,
  disabled = false,
  defaultCountryIso = DEFAULT_PHONE_COUNTRY_ISO,
  placeholder,
  containerStyle,
  validateLive = true,
}: PhoneInputFieldProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);

  const [country, setCountry] = useState<PhoneCountry>(() =>
    parsePhoneInputValue(value, defaultCountryIso).country,
  );

  useEffect(() => {
    if (!value.trim()) return;
    const digits = value.replace(/\D/g, '');
    setCountry((prev) => {
      if (digits.startsWith(prev.dialCode)) return prev;
      return parsePhoneInputValue(value, defaultCountryIso).country;
    });
  }, [value, defaultCountryIso]);

  const nationalDigits = useMemo(() => {
    const digits = value.replace(/\D/g, '');
    if (digits.startsWith(country.dialCode)) {
      return digits.slice(country.dialCode.length);
    }
    return parsePhoneInputValue(value, country.iso).nationalDigits;
  }, [value, country]);

  const nationalDisplay = formatNationalForCountry(country, nationalDigits);
  const validationError = useMemo(
    () =>
      getPhoneValidationError(value, {
        required,
        countryIso: country.iso,
      }),
    [value, required, country.iso],
  );

  useEffect(() => {
    onValidationChange?.(validationError);
  }, [validationError, onValidationChange]);

  const showError = error || (touched && Boolean(validationError));
  const helper = showError
    ? validationError || helperText
    : helperText || (required ? 'Required' : undefined);

  const borderColor = showError
    ? tokens.colors.danger
    : focused
      ? theme.app.dashboard.accentBlue
      : theme.app.dashboard.cardBorder;

  const filteredCountries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.iso.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        `+${c.dialCode}`.includes(q),
    );
  }, [query]);

  const emitNational = (nationalRaw: string, nextCountry: PhoneCountry = country) => {
    const digits = nationalRaw.replace(/\D/g, '').slice(0, Math.max(nextCountry.nationalLength, 15));
    onChangeText(formatPhoneWithCountry(nextCountry, digits));
  };

  const selectCountry = (next: PhoneCountry) => {
    setCountry(next);
    setPickerOpen(false);
    setQuery('');
    emitNational(nationalDigits, next);
  };

  const accent = theme.app.dashboard.accentBlue;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Typography
          variant="label"
          color={showError ? tokens.colors.danger : tokens.colors.textPrimary}
          style={styles.label}
        >
          {label}
          {required ? ' *' : ''}
        </Typography>
      ) : null}

      <View
        style={[
          styles.fieldShell,
          {
            borderColor,
            backgroundColor: theme.app.dashboard.overlayLight,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Country code ${country.flag} +${country.dialCode}`}
          disabled={disabled}
          onPress={() => {
            if (disabled) return;
            setQuery('');
            setPickerOpen(true);
          }}
          style={({ pressed }) => [
            styles.countryBtn,
            {
              backgroundColor: `${accent}18`,
              borderColor: `${accent}44`,
              opacity: pressed || disabled ? 0.82 : 1,
            },
          ]}
        >
          <View
            style={[
              styles.flagBadge,
              {
                backgroundColor: theme.app.dashboard.overlayLight,
                borderColor: glassUi.border.subtle,
              },
            ]}
          >
            <Typography style={styles.flagEmoji}>{country.flag}</Typography>
          </View>
          <Typography
            variant="medium"
            color={accent}
            style={{ fontWeight: '800', letterSpacing: 0.2 }}
          >
            +{country.dialCode}
          </Typography>
          <Ionicons name="chevron-down" size={14} color={accent} />
        </Pressable>

        <View style={styles.divider} />

        <TextInput
          value={nationalDisplay}
          onChangeText={(text) => {
            if (validateLive) setTouched(true);
            emitNational(text);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            setTouched(true);
          }}
          editable={!disabled}
          keyboardType="phone-pad"
          placeholder={
            placeholder ??
            (country.format === 'us' ? '(555) 012-3456' : 'Phone number')
          }
          placeholderTextColor={tokens.colors.textPlaceholder}
          style={styles.input}
 />
      </View>

      {helper ? (
        <Typography
          variant="small"
          color={showError ? tokens.colors.danger : tokens.colors.textMuted}
          style={styles.helper}
        >
          {helper}
        </Typography>
      ) : null}

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.app.dashboard.cardBg,
                borderColor: theme.app.dashboard.cardBorder,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={styles.handleRow}>
              <View
                style={[styles.handle, { backgroundColor: theme.app.dashboard.cardBorder }]}
 />
            </View>

            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetIcon,
                  {
                    backgroundColor: `${accent}18`,
                    borderColor: `${accent}44`,
                  },
                ]}
              >
                <Ionicons name="globe-outline" size={18} color={accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Select country code
                </Typography>
                <Typography variant="small" muted>
                  Current: {country.flag} {country.name} (+{country.dialCode})
                </Typography>
              </View>
              <Pressable
                onPress={() => setPickerOpen(false)}
                hitSlop={8}
                style={[
                  styles.closeBtn,
                  {
                    backgroundColor: theme.app.dashboard.overlayLight,
                    borderColor: theme.app.dashboard.cardBorder,
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={theme.app.text.secondary} />
              </Pressable>
            </View>

            <View
              style={[
                styles.searchBox,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                },
              ]}
            >
              <Ionicons name="search" size={16} color={theme.app.text.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search country, ISO, or +code"
                placeholderTextColor={tokens.colors.textPlaceholder}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
 />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={theme.app.text.muted} />
                </Pressable>
              ) : null}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.iso}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 8 }}
              renderItem={({ item }) => {
                const selected = item.iso === country.iso;
                return (
                  <Pressable
                    onPress={() => selectCountry(item)}
                    style={({ pressed }) => [
                      styles.countryRow,
                      {
                        backgroundColor: selected
                          ? `${accent}16`
                          : pressed
                            ? theme.app.dashboard.overlayLight
                            : 'transparent',
                        borderColor: selected ? `${accent}55` : 'transparent',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowFlag,
                        {
                          backgroundColor: theme.app.dashboard.overlayLight,
                          borderColor: glassUi.border.subtle,
                        },
                      ]}
                    >
                      <Typography style={styles.flagEmoji}>{item.flag}</Typography>
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography variant="medium" style={{ fontWeight: '700' }} numberOfLines={1}>
                        {item.name}
                      </Typography>
                      <Typography variant="small" muted>
                        {item.iso}
                      </Typography>
                    </View>
                    <View
                      style={[
                        styles.dialChip,
                        {
                          backgroundColor: selected ? `${accent}22` : theme.app.dashboard.overlayLight,
                          borderColor: selected ? `${accent}55` : theme.app.dashboard.cardBorder,
                        },
                      ]}
                    >
                      <Typography
                        variant="medium"
                        color={selected ? accent : theme.app.text.primary}
                        style={{ fontWeight: '800' }}
                      >
                        +{item.dialCode}
                      </Typography>
                    </View>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={20} color={accent} />
                    ) : (
                      <View style={{ width: 20 }} />
                    )}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Typography variant="small" muted style={{ padding: 20, textAlign: 'center' }}>
                  No countries match your search.
                </Typography>
              }
  showsVerticalScrollIndicator={false}/>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function resolvePhoneCountryIso(value: string, fallback = DEFAULT_PHONE_COUNTRY_ISO): string {
  return parsePhoneInputValue(value, fallback).country.iso;
}

export function getDefaultPhoneCountry(): PhoneCountry {
  return getPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO);
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: { marginBottom: 8 },
  fieldShell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 8,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  flagBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  flagEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  input: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  helper: { marginTop: 6, minHeight: 16 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '78%',
    gap: 12,
  },
  handleRow: { alignItems: 'center', paddingBottom: 4 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  list: { maxHeight: 420 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  rowFlag: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dialChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
});
