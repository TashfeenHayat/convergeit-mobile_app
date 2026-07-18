import type { ReactNode } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppCard, Button, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

interface InvolvementTabToolbarCardProps {
  icon?: ReactNode;
  iconColor?: string;
  title: string;
  description?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  addLabel: string;
  onAdd: () => void;
  canAdd: boolean;
  children: ReactNode;
}

/** Card shell for a chat-involvement tab: title/description, search + Add
 * button toolbar, and the tab's list content below. */
export function InvolvementTabToolbarCard({
  icon,
  iconColor = tokens.colors.accentBlue,
  title,
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search…",
  addLabel,
  onAdd,
  canAdd,
  children,
}: InvolvementTabToolbarCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        {icon ? <View style={[styles.iconWrap, { backgroundColor: `${iconColor}22` }]}>{icon}</View> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="mediumLarge" style={{ fontWeight: "700" }}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="small" muted style={{ marginTop: 2 }}>
              {description}
            </Typography>
          ) : null}
        </View>
      </View>

      <View style={styles.toolbarRow}>
        <View style={styles.searchWrap}>
          <FontAwesome name="search" size={13} color={tokens.colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            value={searchValue}
            onChangeText={onSearchChange}
            placeholder={searchPlaceholder}
            placeholderTextColor={tokens.colors.textPlaceholder}
            style={styles.searchInput}
          />
        </View>
        {canAdd ? (
          <Button variant="primary" size="compact" onPress={onAdd}>
            {addLabel}
          </Button>
        ) : null}
      </View>

      <View style={{ marginTop: tokens.space.md }}>{children}</View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: tokens.space.md },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm, marginBottom: tokens.space.md },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  toolbarRow: { flexDirection: "row", alignItems: "center", gap: tokens.space.md, flexWrap: "wrap" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    borderRadius: 8,
    paddingHorizontal: tokens.space.sm,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: tokens.colors.textPrimary,
    fontSize: 13,
  },
});
