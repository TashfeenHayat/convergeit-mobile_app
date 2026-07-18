import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type StatusRadioGroupProps = {
  value: 'Active' | 'Inactive';
  onChange: (value: 'Active' | 'Inactive') => void;
};

function RadioOption({
  label,
  selected,
  onPress,
}: {
  label: 'Active' | 'Inactive';
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.option}
    >
      <View style={[styles.ring, selected ? styles.ringActive : styles.ringInactive]}>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      <Typography variant="medium" color={selected ? tokens.colors.accentGreen : tokens.colors.textMuted}>
        {label === 'Inactive' ? 'InActive' : label}
      </Typography>
    </Pressable>
  );
}

export function StatusRadioGroup({ value, onChange }: StatusRadioGroupProps) {
  return (
    <View style={styles.row}>
      <RadioOption label="Active" selected={value === 'Active'} onPress={() => onChange('Active')} />
      <RadioOption label="Inactive" selected={value === 'Inactive'} onPress={() => onChange('Inactive')} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xl,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  ring: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringActive: {
    borderColor: tokens.colors.accentGreen,
  },
  ringInactive: {
    borderColor: tokens.colors.textMuted,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: tokens.colors.accentGreen,
  },
});
