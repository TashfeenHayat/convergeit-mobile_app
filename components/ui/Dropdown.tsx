import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { LiquidGlass } from '@/components/ui/LiquidGlass';
import { Typography } from '@/components/ui/Typography';
import { glassUi } from '@/lib/theme/glass-ui';
import { tokens } from '@/theme/tokens';

export type DropdownOption = {
  label: string;
  value: string;
};

export type DropdownProps = {
  options: string[] | DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  triggerLabel?: string;
  endIcon?: ReactNode;
  variant?: 'outlined' | 'contained' | 'text';
  style?: StyleProp<ViewStyle>;
};

function normalizeOptions(options: string[] | DropdownOption[]): DropdownOption[] {
  return options.map((opt) => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
}

export function Dropdown({
  options,
  value,
  onChange,
  triggerLabel,
  endIcon,
  variant = 'outlined',
  style,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const items = normalizeOptions(options);
  const selected = items.find((o) => o.value === value);
  const label = triggerLabel ?? selected?.label ?? value;

  return (
    <View style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={[styles.trigger, variantStyles[variant]]}
      >
        <Typography variant="medium" style={styles.triggerLabel} numberOfLines={1}>
          {label}
        </Typography>
        {endIcon ?? <Ionicons name="chevron-down" size={16} color={tokens.colors.textSecondary} />}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable onPress={() => undefined} style={styles.menuAnchor}>
            <LiquidGlass intensity="strong" radius={glassUi.radius.lg} elevated contentStyle={styles.menu}>
              <FlatList
                data={items}
                keyExtractor={(item) => item.value}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => {
                  const active = item.value === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      style={[styles.menuRow, active && styles.menuRowActive]}
                    >
                      <Typography
                        variant="medium"
                        color={active ? tokens.colors.accentBlue : tokens.colors.textPrimary}
                      >
                        {item.label}
                      </Typography>
                    </Pressable>
                  );
                }}
  showsVerticalScrollIndicator={false}/>
            </LiquidGlass>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.lg,
    paddingVertical: 10,
    borderRadius: tokens.radius.pill,
    alignSelf: 'flex-start',
  },
  triggerLabel: {
    maxWidth: 160,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 8, 22, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space.xl,
  },
  menuAnchor: {
    width: '100%',
    maxWidth: 280,
  },
  menu: {
    maxHeight: 320,
    paddingVertical: tokens.space.xs,
    overflow: 'hidden',
  },
  menuRow: {
    paddingHorizontal: tokens.space.lg,
    paddingVertical: tokens.space.md,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  menuRowActive: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 12,
  },
});

const variantStyles: Record<'outlined' | 'contained' | 'text', ViewStyle> = {
  outlined: {
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: 'transparent',
  },
  contained: {
    backgroundColor: tokens.colors.pillBg,
  },
  text: {
    backgroundColor: 'transparent',
    paddingHorizontal: tokens.space.sm,
  },
};
