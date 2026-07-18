import { StyleSheet, View } from 'react-native';

import { AppCard, Typography } from '@/components/ui';
import { useAppTheme } from '@/theme';

export type ScreenPlaceholderProps = {
  title: string;
  webPath: string;
  description?: string;
};

/** @deprecated Prefer `ModulePlaceholderScreen` from `@/features/dashboard`. */
export function ScreenPlaceholder({
  title,
  webPath,
  description = 'This module mirrors the web route and will be filled with live API screens next.',
}: ScreenPlaceholderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { padding: theme.spacing.lg, backgroundColor: theme.app.background.bottom }]}>
      <AppCard style={{ gap: theme.spacing.sm }}>
        <Typography variant="boldLarge">{title}</Typography>
        <Typography variant="medium" muted>
          {description}
        </Typography>
        <Typography variant="small" muted>
          Web: {webPath}
        </Typography>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
