import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";

export type ScopeSelectOption = { value: string; label: string };

export type ScopeSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ScopeSelectOption[];
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
};

/**
 * Native replacement for the web `SelectField` — a labeled row that opens a
 * bottom-sheet-style modal with a searchable option list.
 */
export function ScopeSelectField({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
}: ScopeSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <View style={{ minWidth: 0 }}>
      <Typography variant="small" muted style={styles.label}>
        {label}
      </Typography>
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.field, disabled && styles.fieldDisabled]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        <Typography
          variant="medium"
          color={selected ? tokens.colors.textPrimary : tokens.colors.textPlaceholder}
          style={{ flex: 1 }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder}
        </Typography>
        <FontAwesome name="chevron-down" size={12} color={tokens.colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <Typography variant="label" style={{ fontWeight: "600", marginBottom: tokens.space.sm }}>
            {label}
          </Typography>
          {options.length > 6 ? (
            <SearchInput value={search} onChangeText={setSearch} placeholder={searchPlaceholder} />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item, idx) => `${item.value}-${idx}`}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                    setSearch("");
                  }}
                  style={[styles.option, active && styles.optionActive]}
                >
                  <Typography variant="medium" color={active ? tokens.colors.accentBlue : tokens.colors.textPrimary}>
                    {item.label}
                  </Typography>
                  {active ? <FontAwesome name="check" size={14} color={tokens.colors.accentBlue} /> : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Typography variant="small" muted style={{ padding: tokens.space.md, textAlign: "center" }}>
                No options.
              </Typography>
            }
  showsVerticalScrollIndicator={false}/>
          <Pressable style={styles.closeBtn} onPress={() => setOpen(false)}>
            <Typography variant="button" color={tokens.colors.textPrimary} style={{ textAlign: "center" }}>
              Close
            </Typography>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function SearchInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tokens.colors.textPlaceholder}
      style={styles.searchInput}
 />
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 4,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    minHeight: 44,
    paddingHorizontal: tokens.space.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
  },
  fieldDisabled: {
    opacity: 0.45,
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
    maxHeight: "75%",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: tokens.colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 8,
    color: tokens.colors.textPrimary,
    marginBottom: tokens.space.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: tokens.space.sm,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: "rgba(88, 101, 242, 0.12)",
  },
  closeBtn: {
    marginTop: tokens.space.sm,
    paddingVertical: 12,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.pillBg,
  },
});
