import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ServicesDialogShellProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Kept for web parity; RN sheet always fills available width up to a max. */
  maxWidth?: number;
  children?: ReactNode;
};

export function ServicesDialogShell({ open, title, onClose, children }: ServicesDialogShellProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Typography variant="mediumLarge" style={styles.headerText}>
              {title}
            </Typography>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={tokens.colors.textSecondary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.space.lg,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "88%",
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    padding: tokens.space.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: tokens.space.lg,
    gap: tokens.space.sm,
  },
  headerText: { flex: 1 },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { gap: tokens.space.md },
});
