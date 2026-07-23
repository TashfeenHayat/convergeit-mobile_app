import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Typography } from '@/components/ui';
import {
  clampWorkingDaysMask,
  formatWorkingDaysMaskHuman,
  HRMS_DEFAULT_WORKING_DAYS_MASK,
  toggleDayInWorkingDaysMask,
} from '@/lib/utils/hrms/shift-working-days';
import { useAppTheme } from '@/theme';

const DAYS: { bit: number; letter: string; full: string }[] = [
  { bit: 0, letter: 'M', full: 'Monday' },
  { bit: 1, letter: 'T', full: 'Tuesday' },
  { bit: 2, letter: 'W', full: 'Wednesday' },
  { bit: 3, letter: 'T', full: 'Thursday' },
  { bit: 4, letter: 'F', full: 'Friday' },
  { bit: 5, letter: 'S', full: 'Saturday' },
  { bit: 6, letter: 'S', full: 'Sunday' },
];

export type WorkingWeekDayTogglesProps = {
  value: number;
  onChange: (mask: number) => void;
  disabled?: boolean;
};

/** Mon→Sun day chips + Mon–Fri preset (web `WorkingWeekDayToggles` parity). */
export function WorkingWeekDayToggles({
  value,
  onChange,
  disabled = false,
}: WorkingWeekDayTogglesProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const mask = clampWorkingDaysMask(value);
  const summary = formatWorkingDaysMaskHuman(mask);

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: theme.app.dashboard.cardBorder,
          backgroundColor: theme.app.dashboard.overlayLight,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Working week
          </Typography>
          <Typography variant="small" muted>
            Tap days to include or exclude. Attendance uses this pattern with
            the shift timezone.
          </Typography>
        </View>
        <Typography variant="small" muted style={styles.rangeLabel}>
          MON → SUN
        </Typography>
      </View>

      <View style={styles.daysRow}>
        {DAYS.map((d) => {
          const on = (mask & (1 << d.bit)) !== 0;
          return (
            <Pressable
              key={`${d.bit}-${d.full}`}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${d.full} — ${on ? 'working day' : 'off day'}`}
              onPress={() =>
                onChange(toggleDayInWorkingDaysMask(mask, d.bit))
              }
              style={({ pressed }) => [
                styles.dayChip,
                {
                  borderColor: on
                    ? `${accent}BF`
                    : theme.app.dashboard.cardBorder,
                  backgroundColor: on ? `${accent}38` : `${accent}08`,
                  opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
            >
              <Typography
                variant="medium"
                style={{ fontWeight: '800', fontSize: 15 }}
              >
                {d.letter}
              </Typography>
              <Typography
                variant="small"
                muted={!on}
                style={{ fontSize: 9, fontWeight: '600', letterSpacing: 0.5 }}
              >
                {d.full.slice(0, 3).toUpperCase()}
              </Typography>
            </Pressable>
          );
        })}
      </View>

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.app.dashboard.cardBorder },
        ]}
      >
        <Typography variant="small" muted style={{ flex: 1 }}>
          Active days: {summary}
        </Typography>
        <Button
          size="compact"
          variant="outlined"
          disabled={disabled}
          onPress={() => onChange(HRMS_DEFAULT_WORKING_DAYS_MASK)}
        >
          Mon–Fri preset
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  rangeLabel: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
