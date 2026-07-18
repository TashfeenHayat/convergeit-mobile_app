import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Linking } from "react-native";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

const ACCENT = tokens.colors.accentBlue;

export function ProfileMetaGridSection({ children }: { children: ReactNode }) {
  return (
    <View style={styles.gridSection}>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

export function ProfileMetaGridCell({
  icon,
  label,
  children,
  href,
  muted = false,
  fullWidth = false,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  href?: string | null;
  muted?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <View style={[styles.cell, fullWidth && styles.cellFullWidth]}>
      <View style={styles.cellHeader}>
        <View style={styles.iconBox}>{icon}</View>
        <Typography variant="small" muted style={styles.label} numberOfLines={1}>
          {label}
        </Typography>
      </View>
      <BlockValue href={href} muted={muted}>
        {children}
      </BlockValue>
    </View>
  );
}

export function BlockValue({
  children,
  href,
  muted = false,
}: {
  children: ReactNode;
  href?: string | null;
  muted?: boolean;
}) {
  if (href) {
    return (
      <Pressable onPress={() => Linking.openURL(href).catch(() => undefined)} hitSlop={4}>
        <Typography variant="small" color={ACCENT} style={styles.value} numberOfLines={3}>
          {children}
        </Typography>
      </Pressable>
    );
  }

  return (
    <Typography
      variant="small"
      color={muted ? tokens.colors.textMuted : tokens.colors.textPrimary}
      style={styles.value}
      numberOfLines={3}
    >
      {children}
    </Typography>
  );
}

const styles = StyleSheet.create({
  gridSection: {
    paddingHorizontal: tokens.space.md,
    paddingBottom: tokens.space.sm,
    paddingTop: 2,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cell: {
    minWidth: "46%",
    flexGrow: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "rgba(88, 101, 242, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.18)",
  },
  cellFullWidth: {
    minWidth: "100%",
  },
  cellHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(88, 101, 242, 0.16)",
  },
  label: {
    flexShrink: 1,
    textTransform: "uppercase",
    letterSpacing: 0.3,
    fontSize: 10,
  },
  value: {
    marginTop: 6,
    fontWeight: "500",
  },
});
