import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Typography } from '@/components/ui';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export type EmptyPocListStateProps = {
  title?: string;
  description?: string;
};

export function EmptyPocListState({
  title = 'No points of contact yet',
  description = 'Complete company setup and save a POC on the child company. Active links will appear here automatically.',
}: EmptyPocListStateProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;

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
      <View
        style={[
          styles.icon,
          {
            backgroundColor: `${accent}18`,
            borderColor: glassUi.border.subtle,
          },
        ]}
      >
        <Ionicons name="person-circle-outline" size={28} color={theme.app.text.secondary} />
      </View>
      <Typography variant="medium16" style={{ fontWeight: '700', textAlign: 'center' }}>
        {title}
      </Typography>
      <Typography variant="small" muted style={{ textAlign: 'center' }}>
        {description}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
});
