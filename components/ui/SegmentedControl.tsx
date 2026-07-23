import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { tokens } from '@/theme/tokens';

export type SegmentedOption = {
  label: string;
  value: string;
};

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: c.surface,
          borderColor: c.overlayBorder,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && { backgroundColor: c.navActiveBg ?? c.pillActive },
            ]}
          >
            <Typography
              variant="medium"
              color={selected ? c.textPrimary : c.textSecondary}
            >
              {option.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: tokens.radius.pill,
    padding: 4,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
  },
});
