import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { tokens } from '@/theme/tokens';

export type DividerProps = {
  style?: StyleProp<ViewStyle>;
  color?: string;
};

export function Divider({ style, color = tokens.colors.border }: DividerProps) {
  return <View style={[styles.line, { backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    opacity: 0.9,
  },
});
