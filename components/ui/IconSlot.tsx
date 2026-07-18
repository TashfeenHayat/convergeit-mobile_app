import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export type IconSlotProps = {
  children: ReactNode;
  /** Outer hit target (px). Defaults to 24 (sidebar / inline), or `glyph + 8` when `glyph` is set. */
  slot?: number;
  /** Inner glyph size (px) — informational only, sizing is left to the icon itself. */
  glyph?: number;
};

/** Centers an icon in a fixed box — keeps glyphs from drifting inside circles/pills. */
export function IconSlot({ children, slot, glyph }: IconSlotProps) {
  const slotPx = slot ?? (glyph != null ? glyph + 8 : 24);

  return (
    <View style={[styles.slot, { width: slotPx, height: slotPx }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
