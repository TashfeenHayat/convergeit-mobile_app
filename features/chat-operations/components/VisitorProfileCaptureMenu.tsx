import { Modal, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { ChatMessage } from "@/services/chat/chat.types";
import type { VisitorProfileField } from "@/services/chat/visitor-profile.types";

const FIELD_OPTIONS: Array<{ field: VisitorProfileField; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { field: "name", label: "Save as visitor name", icon: "person-outline" },
  { field: "email", label: "Save as visitor email", icon: "mail-outline" },
  { field: "phone", label: "Save as visitor phone", icon: "call-outline" },
];

export type VisitorProfileCaptureMenuProps = {
  open: boolean;
  message: ChatMessage | null;
  busy?: boolean;
  onClose: () => void;
  onCapture: (field: VisitorProfileField, value: string) => void;
};

/**
 * RN replacement for web's text-selection popover — triggered by long-pressing a
 * visitor message bubble (see `ChatMessageBubble.onLongPressVisitorMessage`).
 * Captures the whole message body as the source value for the chosen field.
 */
export function VisitorProfileCaptureMenu({ open, message, busy = false, onClose, onCapture }: VisitorProfileCaptureMenuProps) {
  const text = (message?.content ?? "").trim();

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <Typography variant="mediumLarge" style={{ marginBottom: 4 }}>
            Save to visitor profile
          </Typography>
          <Typography variant="small" muted numberOfLines={3} style={{ marginBottom: tokens.space.md, lineHeight: 18 }}>
            "{text || "—"}"
          </Typography>

          {FIELD_OPTIONS.map((opt) => (
            <Pressable
              key={opt.field}
              disabled={busy || !text}
              onPress={() => onCapture(opt.field, text)}
              style={[styles.option, (busy || !text) && styles.optionDisabled]}
            >
              <Ionicons name={opt.icon} size={18} color={tokens.colors.accentBlue} />
              <Typography variant="medium" style={{ flex: 1 }}>
                {opt.label}
              </Typography>
              <Ionicons name="chevron-forward" size={16} color={tokens.colors.textMuted} />
            </Pressable>
          ))}

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Typography variant="button" color={tokens.colors.textMuted} style={{ textAlign: "center" }}>
              Cancel
            </Typography>
          </Pressable>
        </Pressable>
      </Pressable>
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
    maxWidth: 380,
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    padding: tokens.space.lg,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 4,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  cancelBtn: {
    marginTop: tokens.space.sm,
    paddingVertical: 10,
  },
});
