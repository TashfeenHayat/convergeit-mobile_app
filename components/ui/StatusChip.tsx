import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type StatusChipTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type StatusChipProps = {
  label: string;
  tone?: StatusChipTone;
  style?: StyleProp<ViewStyle>;
};

const TONE_STYLES: Record<
  StatusChipTone,
  { bg: string; border: string; text: string }
> = {
  neutral: {
    bg: 'rgba(255, 255, 255, 0.06)',
    border: tokens.colors.cardBorder,
    text: tokens.colors.textSecondary,
  },
  success: {
    bg: 'rgba(34, 197, 94, 0.14)',
    border: 'rgba(34, 197, 94, 0.35)',
    text: tokens.colors.accentGreen,
  },
  warning: {
    bg: 'rgba(249, 115, 22, 0.14)',
    border: 'rgba(249, 115, 22, 0.35)',
    text: tokens.colors.accentOrange,
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.14)',
    border: 'rgba(239, 68, 68, 0.35)',
    text: tokens.colors.accentRed,
  },
  info: {
    bg: 'rgba(88, 101, 242, 0.16)',
    border: 'rgba(88, 101, 242, 0.4)',
    text: tokens.colors.accentBlue,
  },
};

/** Compact status pill for table cells and list rows. */
export function StatusChip({ label, tone = 'neutral', style }: StatusChipProps) {
  const colors = TONE_STYLES[tone];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      <Typography variant="small" color={colors.text} style={styles.label} numberOfLines={1}>
        {label}
      </Typography>
    </View>
  );
}

/** Map common attendance / leave status strings to chip tones. */
export function statusToneFromLabel(status: string): StatusChipTone {
  const s = status.toLowerCase();
  if (/(present|approved|active|success|online|complete)/.test(s)) return 'success';
  if (/(pending|waiting|late|partial)/.test(s)) return 'warning';
  if (/(absent|reject|fail|error|cancel|offline)/.test(s)) return 'danger';
  if (/(leave|info|review)/.test(s)) return 'info';
  return 'neutral';
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    maxWidth: 160,
  },
  label: {
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
