import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { listUsers } from "@/api/users";
import { Checkbox, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { buildChatRosterUserOptions } from "../utils/chat-roster-user-options";

/** Local — mobile's generic `@/lib/hooks` users-list query depends on
 * platform-admin scoping types not wired into the app; this queries
 * `GET /users` directly (same endpoint, same shape) for the roster picker. */
function useUsersListQuery(
  params: { all?: boolean; userType?: "Internal" | "External"; departmentId?: string },
  options: { enabled: boolean },
) {
  return useQuery({
    queryKey: ["chat-shared-users-list", params] as const,
    queryFn: () => listUsers(params),
    enabled: options.enabled,
  });
}

export type MultiUserCheckboxPickerProps = {
  parentCompanyId?: string;
  userType?: "Internal" | "External";
  departmentId?: string;
  selectedIds: string[];
  onChangeSelectedIds: (ids: string[]) => void;
  canEdit?: boolean;
  disabled?: boolean;
  emptyHint?: string;
  /** Hidden from list unless already selected (e.g. live chat agents when picking QA). */
  excludeUserIds?: string[];
  excludeReason?: string;
};

export function MultiUserCheckboxPicker({
  userType,
  departmentId,
  selectedIds,
  onChangeSelectedIds,
  canEdit = true,
  disabled = false,
  emptyHint,
  excludeUserIds = [],
  excludeReason = "Not eligible for this role",
}: MultiUserCheckboxPickerProps) {
  const [search, setSearch] = useState("");
  const deptId = departmentId?.trim() ?? "";

  const usersQuery = useUsersListQuery(
    { all: true, userType, departmentId: deptId || undefined },
    { enabled: Boolean(userType) && Boolean(deptId) },
  );

  const excludeSet = useMemo(
    () => new Set(excludeUserIds.map((id) => id.trim()).filter(Boolean)),
    [excludeUserIds],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const options = useMemo(
    () => buildChatRosterUserOptions(usersQuery.data, { userType, trustApiScope: true }),
    [usersQuery.data, userType],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byId = new Map(options.map((o) => [o.id, o]));
    for (const id of selectedIds) {
      if (!byId.has(id)) byId.set(id, { id, label: id.slice(0, 8), email: "" });
    }
    const all = [...byId.values()].filter((u) => (!excludeSet.has(u.id) ? true : selectedSet.has(u.id)));
    if (!q) return all.sort((a, b) => a.label.localeCompare(b.label));
    return all
      .filter(
        (u) => u.label.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q),
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [options, search, selectedIds, excludeSet, selectedSet]);

  const hiddenExcludedCount = useMemo(() => {
    let n = 0;
    for (const id of excludeSet) {
      if (!selectedSet.has(id) && options.some((o) => o.id === id)) n += 1;
    }
    return n;
  }, [excludeSet, selectedSet, options]);

  const toggle = (userId: string) => {
    if (!canEdit || disabled) return;
    onChangeSelectedIds(
      selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId],
    );
  };

  const pickAllVisible = () => {
    const ids = new Set(selectedIds);
    for (const u of filtered) ids.add(u.id);
    onChangeSelectedIds([...ids]);
  };

  const clearVisible = () => {
    const visible = new Set(filtered.map((u) => u.id));
    onChangeSelectedIds(selectedIds.filter((id) => !visible.has(id)));
  };

  return (
    <View style={{ opacity: disabled ? 0.6 : 1 }}>
      <View style={styles.toolbarRow}>
        <InputField
          value={search}
          onChangeText={setSearch}
          placeholder="Name, email, pool…"
          editable={canEdit && !disabled}
          containerStyle={{ flex: 1 }}
 />
        {canEdit && !disabled ? (
          <View style={styles.linkRow}>
            <Pressable onPress={pickAllVisible}>
              <Typography variant="small" color={tokens.colors.accentBlue} style={{ fontWeight: "600" }}>
                Select all
              </Typography>
            </Pressable>
            <Pressable onPress={clearVisible}>
              <Typography variant="small" muted>
                Clear
              </Typography>
            </Pressable>
          </View>
        ) : null}
      </View>

      <Typography variant="small" muted style={{ marginBottom: tokens.space.sm }}>
        {selectedIds.length} selected
        {userType ? ` · ${userType} users` : ""}
        {deptId ? " · this department" : ""}
        {hiddenExcludedCount > 0 ? ` · ${hiddenExcludedCount} hidden (${excludeReason.toLowerCase()})` : ""}
      </Typography>

      {usersQuery.isLoading ? (
        <Typography variant="small" muted style={{ paddingVertical: tokens.space.md }}>
          Loading users…
        </Typography>
      ) : null}

      {!usersQuery.isLoading && options.length === 0 ? (
        <Typography variant="small" color="#FBBF24" style={{ paddingVertical: tokens.space.sm }}>
          {emptyHint ?? "No users in this department. Add users under User management first."}
        </Typography>
      ) : null}

      {!usersQuery.isLoading && filtered.length > 0 ? (
        <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {filtered.map((u) => (
            <Checkbox
              key={u.id}
              label={u.label}
              checked={selectedIds.includes(u.id)}
              onChange={() => toggle(u.id)}
              disabled={!canEdit || disabled}
              style={styles.checkboxRow}
 />
          ))}
        </ScrollView>
      ) : null}

      {!usersQuery.isLoading && options.length > 0 && filtered.length === 0 ? (
        <Typography variant="small" muted style={{ paddingVertical: tokens.space.sm }}>
          No users match your search.
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbarRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: tokens.space.md,
    marginBottom: tokens.space.sm,
  },
  linkRow: {
    flexDirection: "row",
    gap: tokens.space.md,
    paddingBottom: 12,
  },
  list: {
    maxHeight: 320,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: tokens.space.sm,
  },
  checkboxRow: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
});
