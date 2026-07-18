import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { tokens } from '@/theme/tokens';

export type HoverTooltipProps = {
  /** Shown in the tooltip bubble. */
  label: string;
  children: ReactNode;
  /** When false, wrapper shrinks to the child. Default: true. */
  fullWidth?: boolean;
};

const AUTO_HIDE_MS = 1600;

/**
 * RN has no `:hover` — tapping the child toggles a small label bubble above it,
 * which auto-dismisses after a short delay.
 */
export function HoverTooltip({ label, children, fullWidth = true }: HoverTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const show = () => {
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
  };

  return (
    <Pressable
      onPress={show}
      accessibilityLabel={label}
      style={[styles.wrapper, fullWidth && styles.fullWidth]}
    >
      {visible ? (
        <View style={styles.bubble} pointerEvents="none">
          <Typography variant="small" style={styles.bubbleText}>
            {label}
          </Typography>
        </View>
      ) : null}
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  bubble: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 8,
    backgroundColor: '#36393f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    zIndex: 10,
    maxWidth: 260,
  },
  bubbleText: {
    color: tokens.colors.textPrimary,
    fontWeight: '700',
  },
});
