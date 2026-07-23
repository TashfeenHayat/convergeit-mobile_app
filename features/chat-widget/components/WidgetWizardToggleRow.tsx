import { Switch, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui';

export type WidgetWizardToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
};

export function WidgetWizardToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: WidgetWizardToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Typography variant="medium" style={{ fontWeight: '600' }}>
          {label}
        </Typography>
        {description ? (
          <Typography variant="small" muted>
            {description}
          </Typography>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ false: '#475569', true: '#22C55E' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#475569"
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
});
