import {
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type FilterButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  /** Visually emphasize when filters are active. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function FilterButton({ active = false, style, ...rest }: FilterButtonProps) {
  return (
    <Button
      variant="outlined"
      size="compact"
      style={[styles.button, active && styles.active, style]}
      {...rest}
    >
      <View style={styles.content}>
        <Ionicons name="filter" size={16} color={tokens.colors.textPrimary} />
        <Typography variant="medium">Filter</Typography>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 0,
    paddingHorizontal: tokens.space.lg,
  },
  active: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: tokens.colors.pillActive,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
});
