import Ionicons from '@expo/vector-icons/Ionicons';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { useAppTheme } from '@/theme';

import type { CalendarProps } from './Calendar.types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function parseIso(value: string): Dayjs | null {
  const raw = value.trim();
  if (!raw) return null;
  const d = dayjs(raw);
  return d.isValid() ? d.startOf('day') : null;
}

function formatDisplay(value: string): string {
  const d = parseIso(value);
  if (!d) return 'Select date';
  return d.format('DD MMM YYYY');
}

function buildMonthCells(month: Dayjs): Array<{
  key: string;
  day: number | null;
  iso: string | null;
}> {
  const start = month.startOf('month');
  const daysInMonth = month.daysInMonth();
  const lead = start.day(); // 0 = Sunday
  const cells: Array<{ key: string; day: number | null; iso: string | null }> =
    [];

  for (let i = 0; i < lead; i += 1) {
    cells.push({ key: `pad-${i}`, day: null, iso: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = start.date(day);
    cells.push({
      key: d.format('YYYY-MM-DD'),
      day,
      iso: d.format('YYYY-MM-DD'),
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({
      key: `trail-${cells.length}`,
      day: null,
      iso: null,
    });
  }
  return cells;
}

/**
 * Date field + month grid popover — web `Calendar` / MUI DatePicker parity.
 * Value is always `YYYY-MM-DD`.
 */
export function Calendar({
  label,
  value,
  onChange,
  min,
  max,
  fullWidth = true,
  error = false,
  helperText,
  rangeMate,
}: CalendarProps) {
  const theme = useAppTheme();
  const c = useThemeColors();
  const accent = theme.app.dashboard.accentBlue;
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => parseIso(value), [value]);
  const mate = useMemo(() => parseIso(rangeMate ?? ''), [rangeMate]);
  const minDate = useMemo(() => parseIso(min ?? ''), [min]);
  const maxDate = useMemo(() => parseIso(max ?? ''), [max]);

  const [viewMonth, setViewMonth] = useState(() =>
    (selected ?? dayjs()).startOf('month'),
  );

  useEffect(() => {
    if (!open) return;
    setViewMonth((selected ?? dayjs()).startOf('month'));
  }, [open, selected]);

  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth]);

  const isDisabled = (iso: string) => {
    const d = dayjs(iso);
    if (minDate && d.isBefore(minDate, 'day')) return true;
    if (maxDate && d.isAfter(maxDate, 'day')) return true;
    return false;
  };

  const helper = helperText?.trim() ?? '';

  return (
    <View style={[styles.wrap, fullWidth && styles.fullWidth]}>
      <Typography variant="label" muted style={styles.label}>
        {label}
      </Typography>

      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDisplay(value)}`}
        style={({ pressed }) => [
          styles.field,
          {
            borderBottomColor: open
              ? accent
              : error
                ? theme.app.dashboard.accentRed
                : c.cardBorder,
            backgroundColor: open ? `${accent}14` : 'transparent',
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <Typography
          variant="medium"
          color={value.trim() ? theme.app.text.primary : c.textMuted}
          style={{ flex: 1 }}
        >
          {formatDisplay(value)}
        </Typography>
        <Ionicons name="calendar-outline" size={18} color={c.textMuted} />
      </Pressable>

      {helper ? (
        <Typography
          variant="small"
          color={error ? theme.app.dashboard.accentRed : c.textMuted}
          style={styles.helper}
        >
          {helper}
        </Typography>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.popover,
              {
                backgroundColor: theme.app.dashboard.sidebarBg ?? '#0B1220',
                borderColor: theme.app.dashboard.cardBorder,
              },
            ]}
          >
            <View style={styles.monthHeader}>
              <Typography variant="medium16" style={{ fontWeight: '700' }}>
                {viewMonth.format('MMMM YYYY')}
              </Typography>
              <View style={styles.monthNav}>
                <Pressable
                  accessibilityLabel="Previous month"
                  onPress={() =>
                    setViewMonth((m) => m.subtract(1, 'month').startOf('month'))
                  }
                  style={({ pressed }) => [
                    styles.navBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={theme.app.text.primary}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="Next month"
                  onPress={() =>
                    setViewMonth((m) => m.add(1, 'month').startOf('month'))
                  }
                  style={({ pressed }) => [
                    styles.navBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.app.text.primary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d, i) => (
                <Typography
                  key={`${d}-${i}`}
                  variant="small"
                  muted
                  style={styles.weekCell}
                >
                  {d}
                </Typography>
              ))}
            </View>

            <View style={styles.grid}>
              {cells.map((cell) => {
                if (!cell.iso || cell.day == null) {
                  return <View key={cell.key} style={styles.dayCell} />;
                }
                const disabled = isDisabled(cell.iso);
                const isSelected = selected?.format('YYYY-MM-DD') === cell.iso;
                const isMate = mate?.format('YYYY-MM-DD') === cell.iso;
                return (
                  <Pressable
                    key={cell.key}
                    disabled={disabled}
                    onPress={() => {
                      onChange(cell.iso!);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: accent,
                        borderRadius: 20,
                      },
                      !isSelected &&
                        isMate && {
                          borderWidth: 1.5,
                          borderColor: theme.app.text.primary,
                          borderRadius: 20,
                        },
                      { opacity: disabled ? 0.35 : pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Typography
                      variant="small"
                      color={
                        isSelected
                          ? '#FFFFFF'
                          : theme.app.text.primary
                      }
                      style={{ fontWeight: isSelected || isMate ? '700' : '500' }}
                    >
                      {cell.day}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    marginBottom: 2,
  },
  field: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 2,
  },
  helper: {
    marginTop: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  popover: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    maxWidth: 360,
    width: '100%',
    alignSelf: 'center',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
