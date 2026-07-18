import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { hasActiveChatScopeFilters } from "../utils/chat-scope-filters-active";
import { ChatScopeFilterPopoverPanel, type ChatScopeFilterPopoverPanelProps } from "./ChatScopeFilterPopoverPanel";

export type ChatScopeFiltersToolbarProps = Omit<ChatScopeFilterPopoverPanelProps, "hasActiveFilters" | "onClose">;

/** Scope filters as a toolbar Filter button + bottom sheet (saves vertical space on chat workstations). */
export function ChatScopeFiltersToolbar(props: ChatScopeFiltersToolbarProps) {
  const [open, setOpen] = useState(false);
  const hasActive = useMemo(() => hasActiveChatScopeFilters(props.filters), [props.filters]);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.filterBtn, hasActive && styles.filterBtnActive]}
        accessibilityRole="button"
        accessibilityLabel="Open scope filters"
      >
        <FontAwesome name="filter" size={13} color={hasActive ? tokens.colors.accentBlue : tokens.colors.textMuted} />
        <Typography variant="small" color={hasActive ? tokens.colors.accentBlue : tokens.colors.textMuted}>
          Filter
        </Typography>
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <ChatScopeFilterPopoverPanel {...props} hasActiveFilters={hasActive} onClose={() => setOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: tokens.space.md,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
  },
  filterBtnActive: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: "rgba(88, 101, 242, 0.1)",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: tokens.radius.lg,
    borderTopRightRadius: tokens.radius.lg,
    padding: tokens.space.lg,
    maxHeight: "80%",
  },
});
