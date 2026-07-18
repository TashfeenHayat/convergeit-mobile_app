import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { AppCard, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

type ChatScopeTableFiltersCardProps = {
  hint?: string;
  hasActiveFilters: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children: ReactNode;
};

/** Collapsible scope filters card for chat configure tables (involvement, etc.). */
export function ChatScopeTableFiltersCard({
  hint = "Filters this list only — does not affect Add actions",
  hasActiveFilters,
  expanded: expandedProp,
  onExpandedChange,
  children,
}: ChatScopeTableFiltersCardProps) {
  const [expandedState, setExpandedState] = useState(hasActiveFilters);
  const expanded = expandedProp ?? expandedState;

  useEffect(() => {
    if (hasActiveFilters && expandedProp === undefined) setExpandedState(true);
  }, [hasActiveFilters, expandedProp]);

  const toggle = () => {
    const next = !expanded;
    if (onExpandedChange) onExpandedChange(next);
    else setExpandedState(next);
  };

  return (
    <AppCard style={styles.card}>
      <Pressable onPress={toggle} style={styles.header} accessibilityRole="button" accessibilityState={{ expanded }}>
        <FontAwesome name="filter" size={16} color={tokens.colors.textMuted} />
        <Typography variant="label" style={{ fontWeight: "600" }}>
          Filters
        </Typography>
        {hasActiveFilters ? (
          <View style={styles.activeChip}>
            <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "600" }}>
              Active
            </Typography>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        <FontAwesome name={expanded ? "chevron-up" : "chevron-down"} size={13} color={tokens.colors.textMuted} />
      </Pressable>
      {expanded ? (
        <View style={styles.body}>
          {hint ? (
            <Typography variant="small" muted style={{ marginBottom: tokens.space.sm }}>
              {hint}
            </Typography>
          ) : null}
          {children}
        </View>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
  },
  activeChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(88, 101, 242, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(88, 101, 242, 0.35)",
  },
  body: {
    marginTop: tokens.space.md,
  },
});
