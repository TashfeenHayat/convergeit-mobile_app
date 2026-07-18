import { StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type DataNotFoundPlaceholderProps = {
  message?: string;
};

export function DataNotFoundPlaceholder({ message = 'Coming Soon....' }: DataNotFoundPlaceholderProps) {
  return (
    <View style={styles.container}>
      <Typography variant="mediumLarge" color={tokens.colors.textMuted}>
        {message}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
  },
});
