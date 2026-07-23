import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { useAppTheme } from '@/theme';

export type TimeFieldProps = {
  label: string;
  /** Stored value as `HH:mm` (24h). Empty string = unset. */
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

type Period = 'AM' | 'PM';

type ParsedTime = {
  hour12: number;
  minute: number;
  period: Period;
};

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS: Period[] = ['AM', 'PM'];
const ROW_H = 40;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseHhMm(value: string): ParsedTime | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const h24 = Number(m[1]);
  const minute = Number(m[2]);
  if (
    !Number.isFinite(h24) ||
    !Number.isFinite(minute) ||
    h24 < 0 ||
    h24 > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  const period: Period = h24 >= 12 ? 'PM' : 'AM';
  let hour12 = h24 % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute, period };
}

function toHhMm(hour12: number, minute: number, period: Period): string {
  let h24 = hour12 % 12;
  if (period === 'PM') h24 += 12;
  return `${pad2(h24)}:${pad2(minute)}`;
}

function formatDisplay(value: string): string {
  const parsed = parseHhMm(value);
  if (!parsed) return '--:-- --';
  return `${pad2(parsed.hour12)}:${pad2(parsed.minute)} ${parsed.period}`;
}

/**
 * Time field + columnar hour / minute / AM·PM picker (web time select parity).
 * Value is always `HH:mm` (24h) for API payloads.
 */
export function TimeField({
  label,
  value,
  onChange,
  error = false,
  helperText,
  disabled = false,
}: TimeFieldProps) {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const accent = theme.app.dashboard.accentBlue;
  const [open, setOpen] = useState(false);

  const parsedValue = parseHhMm(value);
  const [hour12, setHour12] = useState(parsedValue?.hour12 ?? 7);
  const [minute, setMinute] = useState(parsedValue?.minute ?? 0);
  const [period, setPeriod] = useState<Period>(parsedValue?.period ?? 'AM');

  const hourRef = useRef<FlatList<number>>(null);
  const minuteRef = useRef<FlatList<number>>(null);

  useEffect(() => {
    if (!open) return;
    const parsed = parseHhMm(value) ?? {
      hour12: 7,
      minute: 0,
      period: 'AM' as Period,
    };
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
    requestAnimationFrame(() => {
      try {
        hourRef.current?.scrollToIndex({
          index: Math.max(0, parsed.hour12 - 1),
          animated: false,
          viewPosition: 0.4,
        });
        minuteRef.current?.scrollToIndex({
          index: parsed.minute,
          animated: false,
          viewPosition: 0.4,
        });
      } catch {
        // ignore scroll failures before layout
      }
    });
  }, [open, value]);

  const apply = (h: number, m: number, p: Period) => {
    setHour12(h);
    setMinute(m);
    setPeriod(p);
    onChange(toHhMm(h, m, p));
  };

  const helper = helperText?.trim() ?? '';
  const display = useMemo(() => formatDisplay(value), [value]);

  const renderHour = ({ item }: ListRenderItemInfo<number>) => {
    const selected = item === hour12;
    return (
      <Pressable
        onPress={() => apply(item, minute, period)}
        style={[styles.cell, selected && { backgroundColor: accent }]}
      >
        <Typography
          variant="medium"
          color={selected ? '#FFFFFF' : '#111827'}
          style={{ fontWeight: selected ? '700' : '500' }}
        >
          {pad2(item)}
        </Typography>
      </Pressable>
    );
  };

  const renderMinute = ({ item }: ListRenderItemInfo<number>) => {
    const selected = item === minute;
    return (
      <Pressable
        onPress={() => apply(hour12, item, period)}
        style={[styles.cell, selected && { backgroundColor: accent }]}
      >
        <Typography
          variant="medium"
          color={selected ? '#FFFFFF' : '#111827'}
          style={{ fontWeight: selected ? '700' : '500' }}
        >
          {pad2(item)}
        </Typography>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrap}>
      <Typography variant="label" muted style={styles.label}>
        {label}
      </Typography>

      <Pressable
        disabled={disabled}
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${display}`}
        style={({ pressed }) => [
          styles.field,
          {
            borderColor: error
              ? theme.app.danger
              : open || pressed
                ? accent
                : theme.app.dashboard.cardBorder,
            backgroundColor: theme.app.dashboard.overlayLight,
            opacity: disabled ? 0.55 : 1,
          },
        ]}
      >
        <Typography
          variant="medium"
          color={value.trim() ? colors.textPrimary : colors.textMuted}
          style={{ flex: 1 }}
        >
          {display}
        </Typography>
        <View
          style={[
            styles.clockBtn,
            {
              backgroundColor: `${accent}22`,
              borderColor: `${accent}55`,
            },
          ]}
        >
          <Ionicons name="time-outline" size={16} color={accent} />
        </View>
      </Pressable>

      {helper ? (
        <Typography
          variant="small"
          color={error ? theme.app.danger : colors.textMuted}
        >
          {helper}
        </Typography>
      ) : null}

      {open ? (
        <View style={styles.popover}>
          <View style={styles.columns}>
            <FlatList
              ref={hourRef}
              data={HOURS}
              keyExtractor={(item) => `h-${item}`}
              renderItem={renderHour}
              style={styles.column}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ROW_H,
                offset: ROW_H * index,
                index,
              })}
              onScrollToIndexFailed={() => undefined}
 />
            <FlatList
              ref={minuteRef}
              data={MINUTES}
              keyExtractor={(item) => `m-${item}`}
              renderItem={renderMinute}
              style={styles.column}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              getItemLayout={(_, index) => ({
                length: ROW_H,
                offset: ROW_H * index,
                index,
              })}
              onScrollToIndexFailed={() => undefined}
 />
            <View style={styles.periodCol}>
              {PERIODS.map((p) => {
                const selected = p === period;
                return (
                  <Pressable
                    key={p}
                    onPress={() => apply(hour12, minute, p)}
                    style={[
                      styles.cell,
                      selected && { backgroundColor: accent },
                    ]}
                  >
                    <Typography
                      variant="medium"
                      color={selected ? '#FFFFFF' : '#111827'}
                      style={{ fontWeight: selected ? '700' : '500' }}
                    >
                      {p}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6, zIndex: 2 },
  label: { marginBottom: 2 },
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  popover: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  columns: {
    flexDirection: 'row',
    height: 220,
  },
  column: {
    flex: 1,
  },
  periodCol: {
    width: 72,
    paddingVertical: 8,
    gap: 4,
    justifyContent: 'center',
  },
  cell: {
    height: ROW_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    marginVertical: 2,
    borderRadius: 8,
  },
});
