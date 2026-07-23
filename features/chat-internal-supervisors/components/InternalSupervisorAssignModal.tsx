import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Checkbox, FormModal, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { pickItemsArray } from "@/lib/companies/scope-tree-options";
import { isRecord, pickStr } from "@/lib/utils/core";
import { useUsersListQuery } from "@/lib/hooks/query";
import { usePoolsListQuery } from "@/lib/hooks/query/hrms";
import { listInternalSupervisorsInScope } from "@/services/chat/internal-supervisors.api";

type UnassignedUserRow = { id: string; name: string; email: string; departmentName: string };
type PoolRow = { id: string; name: string; departmentName: string };

function userDisplayName(raw: Record<string, unknown>): string {
  const first = pickStr(raw, ["firstName", "first_name"]) || "";
  const last = pickStr(raw, ["lastName", "last_name"]) || "";
  const joined = `${first} ${last}`.trim();
  return joined || pickStr(raw, ["email"]) || pickStr(raw, ["id"]) || "User";
}

interface InternalSupervisorAssignModalProps {
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  saving: boolean;
  onSave: (userId: string, poolIds: string[]) => void;
}

export function InternalSupervisorAssignModal({
  open,
  onClose,
  canEdit,
  saving,
  onSave,
}: InternalSupervisorAssignModalProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  const usersQuery = useUsersListQuery(
    { all: true, userType: "Internal", unassignedPoolOnly: true, headRole: "none" },
    { enabled: open },
  );

  const userRows = useMemo<UnassignedUserRow[]>(() => {
    return pickItemsArray(usersQuery.data)
      .filter(isRecord)
      .filter((raw) => pickStr(raw, ["userType", "user_type"]) === "Internal")
      .map((raw) => {
        const id = pickStr(raw, ["id"]) || "";
        if (!id) return null;
        const dept = isRecord(raw.department) ? raw.department : null;
        return {
          id,
          name: userDisplayName(raw),
          email: pickStr(raw, ["email"]) || "—",
          departmentName: pickStr(dept ?? {}, ["name"]) || pickStr(raw, ["departmentName"]) || "—",
        };
      })
      .filter((row): row is UnassignedUserRow => row != null);
  }, [usersQuery.data]);

  const poolsQuery = usePoolsListQuery(
    { all: true, departmentType: "Internal" },
    { enabled: open && Boolean(selectedUserId) },
  );

  const poolRows = useMemo<PoolRow[]>(() => {
    return pickItemsArray(poolsQuery.data)
      .filter(isRecord)
      .map((raw) => {
        const id = pickStr(raw, ["id"]) || "";
        if (!id) return null;
        const dept = isRecord(raw.department) ? raw.department : null;
        return {
          id,
          name: pickStr(raw, ["name"]) || "Pool",
          departmentName: pickStr(dept ?? {}, ["name"]) || "Internal",
        };
      })
      .filter((row): row is PoolRow => row != null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [poolsQuery.data]);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId("");
    setSelectedPoolIds([]);
  }, [open]);

  useEffect(() => {
    if (!open || !selectedUserId) {
      setSelectedPoolIds([]);
      return;
    }
    let cancelled = false;
    void listInternalSupervisorsInScope({ all: true }).then((rows) => {
      if (cancelled) return;
      setSelectedPoolIds(rows.filter((row) => row.userId === selectedUserId).map((row) => row.poolId));
    });
    return () => {
      cancelled = true;
    };
  }, [open, selectedUserId]);

  const togglePool = (poolId: string) => {
    setSelectedPoolIds((prev) => (prev.includes(poolId) ? prev.filter((id) => id !== poolId) : [...prev, poolId]));
  };

  const saveDisabled = !canEdit || saving || !selectedUserId.trim() || selectedPoolIds.length === 0;

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title="Assign internal supervisor"
      description="Pick an internal user without a pool, then select internal pools they supervise."
      primaryButtonLabel={saving ? "Saving…" : "Save supervisor"}
      primaryButtonDisabled={saveDisabled}
      onSave={() => onSave(selectedUserId.trim(), selectedPoolIds)}
    >
      <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
        <Typography variant="medium" style={{ fontWeight: "700", marginBottom: tokens.space.sm }}>
          Internal users without a pool
        </Typography>
        {usersQuery.isLoading ? (
          <ActivityIndicator color={tokens.colors.accentBlue} />
        ) : (
          <FlatList
            data={userRows}
            scrollEnabled={false}
            keyExtractor={(u) => u.id}
            renderItem={({ item: user }) => (
              <Pressable
                onPress={() => setSelectedUserId(user.id)}
                style={[styles.userRow, selectedUserId === user.id && styles.userRowSelected]}
              >
                <Typography variant="medium" style={{ fontWeight: "600" }}>
                  {user.name}
                </Typography>
                <Typography variant="small" muted>
                  {user.email} · {user.departmentName}
                </Typography>
              </Pressable>
            )}
  showsVerticalScrollIndicator={false}/>
        )}

        <Typography variant="medium" style={{ fontWeight: "700", marginTop: tokens.space.lg, marginBottom: tokens.space.sm }}>
          Internal pools
        </Typography>
        {!selectedUserId ? (
          <Typography variant="small" muted>
            Select a user first.
          </Typography>
        ) : poolsQuery.isLoading ? (
          <ActivityIndicator color={tokens.colors.accentBlue} />
        ) : (
          poolRows.map((pool) => (
            <Checkbox
              key={pool.id}
              label={`${pool.name} · ${pool.departmentName}`}
              checked={selectedPoolIds.includes(pool.id)}
              onChange={() => togglePool(pool.id)}
              disabled={!canEdit || saving}
 />
          ))
        )}
      </ScrollView>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  userRow: {
    paddingVertical: tokens.space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.colors.border,
  },
  userRowSelected: { backgroundColor: "rgba(88,101,242,0.08)" },
});
