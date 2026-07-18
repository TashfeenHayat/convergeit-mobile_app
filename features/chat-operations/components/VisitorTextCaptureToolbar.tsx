import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import type { VisitorProfileField } from "@/services/chat/visitor-profile.types";

/**
 * RN note: web anchors this toolbar at the text-selection caret (`x`/`y` from
 * `window.getSelection()`), which has no native equivalent. Mobile instead
 * triggers `VisitorProfileCaptureMenu` from a long-press on the message
 * bubble; this component is kept for API parity and renders as an inline
 * floating bar near the supplied anchor point when used directly.
 */
export interface VisitorTextCaptureAnchor {
  x: number;
  y: number;
}

interface VisitorTextCaptureToolbarProps {
  anchor: VisitorTextCaptureAnchor;
  selectedText: string;
  busy?: boolean;
  onSelectField: (field: VisitorProfileField) => void;
  onDismiss: () => void;
}

const ACTIONS: Array<{ field: VisitorProfileField; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { field: "name", label: "Set name", icon: "person-outline" },
  { field: "email", label: "Set email", icon: "mail-outline" },
  { field: "phone", label: "Set phone", icon: "call-outline" },
];

export function VisitorTextCaptureToolbar({ anchor, selectedText, busy = false, onSelectField, onDismiss }: VisitorTextCaptureToolbarProps) {
  const preview = selectedText.length > 48 ? `${selectedText.slice(0, 45).trim()}…` : selectedText;

  return (
    <View
      style={[
        styles.wrap,
        {
          top: Math.max(8, anchor.y - 8),
          left: Math.max(8, anchor.x - 110),
        },
      ]}
    >
      <View style={styles.header}>
        <Typography variant="small" muted style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Save to visitor profile
        </Typography>
        <Typography variant="small" numberOfLines={1} style={{ fontWeight: "600", marginTop: 2 }}>
          "{preview}"
        </Typography>
      </View>
      <View style={{ paddingVertical: 4 }}>
        {ACTIONS.map(({ field, label, icon }) => (
          <Pressable key={field} disabled={busy} onPress={() => onSelectField(field)} style={[styles.action, busy && { opacity: 0.5 }]}>
            <Ionicons name={icon} size={16} color={tokens.colors.accentBlue} />
            <Typography variant="small" style={{ fontWeight: "600" }}>
              {label}
            </Typography>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onDismiss} style={styles.dismiss} hitSlop={6}>
        <Ionicons name="close" size={14} color={tokens.colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    minWidth: 220,
    maxWidth: 280,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: tokens.colors.surfaceElevated,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    zIndex: 50,
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.cardBorder,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dismiss: {
    position: "absolute",
    top: 6,
    right: 6,
    padding: 4,
  },
});
