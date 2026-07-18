import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { MobileScreen } from "@/components/layout";
import {
  AppCard,
  Button,
  ConfirmActionModal,
  FormModal,
  SelectField,
  Typography,
} from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import {
  useAssignDepartmentShiftMutation,
  useAssignPoolShiftMutation,
  useCreateUserShiftAssignmentMutation,
  useDepartmentShiftAssignmentsListQuery,
  useDepartmentsListQuery,
  usePoolShiftAssignmentsListQuery,
  usePoolsListQuery,
  useRemoveDepartmentShiftAssignmentMutation,
  useRemovePoolShiftAssignmentMutation,
  useRemoveUserShiftAssignmentMutation,
  useShiftsListQuery,
  useUserShiftAssignmentsListQuery,
} from "@/lib/hooks/query/hrms";
import { useUsersListQuery } from "@/lib/hooks/query/users";
import { isRecord, pickStr } from "@/lib/utils/core";
import { pickApiItems } from "@/lib/utils/admin-list";
import { useAppTheme } from "@/theme";

type AssignmentRow = {
  id: string;
  title: string;
  subtitle: string;
};

function parseAssignmentRows(data: unknown, kind: "department" | "pool" | "user"): AssignmentRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ["id"]);
      if (!id) return null;
      const shift = isRecord(r.shift) ? r.shift : null;
      const shiftName = pickStr(shift, ["name"]) || pickStr(r, ["shiftName"]) || "Shift";
      if (kind === "department") {
        const dept = isRecord(r.department) ? r.department : null;
        return {
          id,
          title: pickStr(dept, ["name"]) || pickStr(r, ["departmentName"]) || "Department",
          subtitle: shiftName,
        };
      }
      if (kind === "pool") {
        const pool = isRecord(r.pool) ? r.pool : null;
        return {
          id,
          title: pickStr(pool, ["name"]) || pickStr(r, ["poolName"]) || "Pool",
          subtitle: shiftName,
        };
      }
      const user = isRecord(r.user) ? r.user : null;
      const name = [pickStr(user, ["firstName"]), pickStr(user, ["lastName"])].filter(Boolean).join(" ");
      return {
        id,
        title: name || pickStr(user, ["email"]) || pickStr(r, ["userName"]) || "User",
        subtitle: shiftName,
      };
    })
    .filter((x): x is AssignmentRow => x !== null);
}

function useShiftOptions(enabled: boolean) {
  const shiftsQuery = useShiftsListQuery({ page: 1, limit: 100 }, { enabled });
  return useMemo(
    () =>
      pickApiItems(shiftsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          return id ? { value: id, label: pickStr(r, ["name"]) || id } : null;
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [shiftsQuery.data],
  );
}

export function DepartmentShiftAssignmentsPage() {
  const theme = useAppTheme();
  const [departmentId, setDepartmentId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deptsQuery = useDepartmentsListQuery({ page: 1, limit: 100 });
  const listQuery = useDepartmentShiftAssignmentsListQuery(
    departmentId ? { departmentId, page: 1, limit: 100, all: true } : undefined,
  );
  const assignMutation = useAssignDepartmentShiftMutation();
  const removeMutation = useRemoveDepartmentShiftAssignmentMutation();
  const shiftOptions = useShiftOptions(modalOpen);

  const deptOptions = useMemo(
    () =>
      pickApiItems(deptsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          return id ? { value: id, label: pickStr(r, ["name"]) || id } : null;
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [deptsQuery.data],
  );
  const rows = useMemo(() => parseAssignmentRows(listQuery.data, "department"), [listQuery.data]);

  return (
    <AssignmentScreen
      title="Department shifts"
      subtitle="Assign shift templates to departments."
      scopeLabel="Department"
      scopeValue={departmentId}
      onScopeChange={setDepartmentId}
      scopeOptions={deptOptions}
      rows={rows}
      listQuery={listQuery}
      onAdd={() => {
        setShiftId("");
        setModalOpen(true);
      }}
      onDelete={setDeleteId}
      modalOpen={modalOpen}
      onCloseModal={() => setModalOpen(false)}
      shiftId={shiftId}
      onShiftChange={setShiftId}
      shiftOptions={shiftOptions}
      saving={assignMutation.isPending}
      onSave={async () => {
        if (!departmentId || !shiftId) {
          Alert.alert("Validation", "Select department and shift.");
          return;
        }
        try {
          await assignMutation.mutateAsync({ departmentId, shiftId });
          setModalOpen(false);
        } catch (err) {
          Alert.alert("Assign failed", extractApiErrorMessage(err));
        }
      }}
      deleteId={deleteId}
      onDismissDelete={() => setDeleteId(null)}
      deleting={removeMutation.isPending}
      onConfirmDelete={async () => {
        if (!deleteId) return;
        try {
          await removeMutation.mutateAsync(deleteId);
          setDeleteId(null);
        } catch (err) {
          Alert.alert("Remove failed", extractApiErrorMessage(err));
        }
      }}
      theme={theme}
    />
  );
}

export function PoolShiftAssignmentsPage() {
  const theme = useAppTheme();
  const [poolId, setPoolId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const poolsQuery = usePoolsListQuery({ page: 1, limit: 100, all: true });
  const listQuery = usePoolShiftAssignmentsListQuery(
    poolId ? { poolId, page: 1, limit: 100 } : { all: true, page: 1, limit: 100 },
  );
  const assignMutation = useAssignPoolShiftMutation();
  const removeMutation = useRemovePoolShiftAssignmentMutation();
  const shiftOptions = useShiftOptions(modalOpen);

  const poolOptions = useMemo(
    () =>
      pickApiItems(poolsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          return id ? { value: id, label: pickStr(r, ["name"]) || id } : null;
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [poolsQuery.data],
  );
  const rows = useMemo(() => parseAssignmentRows(listQuery.data, "pool"), [listQuery.data]);

  return (
    <AssignmentScreen
      title="Pool shifts"
      subtitle="Assign shift templates to pools."
      scopeLabel="Pool (optional filter)"
      scopeValue={poolId}
      onScopeChange={setPoolId}
      scopeOptions={[{ value: "", label: "All pools" }, ...poolOptions]}
      rows={rows}
      listQuery={listQuery}
      onAdd={() => {
        setShiftId("");
        setModalOpen(true);
      }}
      onDelete={setDeleteId}
      modalOpen={modalOpen}
      onCloseModal={() => setModalOpen(false)}
      shiftId={shiftId}
      onShiftChange={setShiftId}
      shiftOptions={shiftOptions}
      extraModalFields={
        <SelectField
          label="Pool"
          value={poolId}
          onChange={setPoolId}
          options={poolOptions.length ? poolOptions : [{ value: "", label: "Loading…" }]}
        />
      }
      saving={assignMutation.isPending}
      onSave={async () => {
        if (!poolId || !shiftId) {
          Alert.alert("Validation", "Select pool and shift.");
          return;
        }
        try {
          await assignMutation.mutateAsync({ poolId, shiftId });
          setModalOpen(false);
        } catch (err) {
          Alert.alert("Assign failed", extractApiErrorMessage(err));
        }
      }}
      deleteId={deleteId}
      onDismissDelete={() => setDeleteId(null)}
      deleting={removeMutation.isPending}
      onConfirmDelete={async () => {
        if (!deleteId) return;
        try {
          await removeMutation.mutateAsync(deleteId);
          setDeleteId(null);
        } catch (err) {
          Alert.alert("Remove failed", extractApiErrorMessage(err));
        }
      }}
      theme={theme}
    />
  );
}

export function UserShiftAssignmentsPage() {
  const theme = useAppTheme();
  const [userId, setUserId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [shiftId, setShiftId] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const usersQuery = useUsersListQuery({ page: 1, limit: 100 });
  const listQuery = useUserShiftAssignmentsListQuery(
    userId ? { userId, page: 1, limit: 100, all: true } : undefined,
  );
  const assignMutation = useCreateUserShiftAssignmentMutation();
  const removeMutation = useRemoveUserShiftAssignmentMutation();
  const shiftOptions = useShiftOptions(modalOpen);

  const userOptions = useMemo(
    () =>
      pickApiItems(usersQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ["id"]);
          if (!id) return null;
          const name = [pickStr(r, ["firstName"]), pickStr(r, ["lastName"])].filter(Boolean).join(" ");
          return { value: id, label: name || pickStr(r, ["email"]) || id };
        })
        .filter((x): x is { value: string; label: string } => x !== null),
    [usersQuery.data],
  );
  const rows = useMemo(() => parseAssignmentRows(listQuery.data, "user"), [listQuery.data]);

  return (
    <AssignmentScreen
      title="User shifts"
      subtitle="Assign shift templates to individual users."
      scopeLabel="User"
      scopeValue={userId}
      onScopeChange={setUserId}
      scopeOptions={userOptions}
      rows={rows}
      listQuery={listQuery}
      onAdd={() => {
        setShiftId("");
        setModalOpen(true);
      }}
      onDelete={setDeleteId}
      modalOpen={modalOpen}
      onCloseModal={() => setModalOpen(false)}
      shiftId={shiftId}
      onShiftChange={setShiftId}
      shiftOptions={shiftOptions}
      saving={assignMutation.isPending}
      onSave={async () => {
        if (!userId || !shiftId) {
          Alert.alert("Validation", "Select user and shift.");
          return;
        }
        try {
          await assignMutation.mutateAsync({ userId, shiftId });
          setModalOpen(false);
        } catch (err) {
          Alert.alert("Assign failed", extractApiErrorMessage(err));
        }
      }}
      deleteId={deleteId}
      onDismissDelete={() => setDeleteId(null)}
      deleting={removeMutation.isPending}
      onConfirmDelete={async () => {
        if (!deleteId) return;
        try {
          await removeMutation.mutateAsync(deleteId);
          setDeleteId(null);
        } catch (err) {
          Alert.alert("Remove failed", extractApiErrorMessage(err));
        }
      }}
      theme={theme}
    />
  );
}

function AssignmentScreen({
  title,
  subtitle,
  scopeLabel,
  scopeValue,
  onScopeChange,
  scopeOptions,
  rows,
  listQuery,
  onAdd,
  onDelete,
  modalOpen,
  onCloseModal,
  shiftId,
  onShiftChange,
  shiftOptions,
  extraModalFields,
  saving,
  onSave,
  deleteId,
  onDismissDelete,
  deleting,
  onConfirmDelete,
  theme,
}: {
  title: string;
  subtitle: string;
  scopeLabel: string;
  scopeValue: string;
  onScopeChange: (v: string) => void;
  scopeOptions: { value: string; label: string }[];
  rows: AssignmentRow[];
  listQuery: { isLoading: boolean; data?: unknown; isError: boolean; error: unknown; isRefetching: boolean; refetch: () => unknown };
  onAdd: () => void;
  onDelete: (id: string) => void;
  modalOpen: boolean;
  onCloseModal: () => void;
  shiftId: string;
  onShiftChange: (v: string) => void;
  shiftOptions: { value: string; label: string }[];
  extraModalFields?: ReactNode;
  saving: boolean;
  onSave: () => void | Promise<void>;
  deleteId: string | null;
  onDismissDelete: () => void;
  deleting: boolean;
  onConfirmDelete: () => void | Promise<void>;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const needsScope = !scopeLabel.toLowerCase().includes("optional");

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">{title}</Typography>
        <Typography variant="medium" muted>
          {subtitle}
        </Typography>
        <SelectField
          label={scopeLabel}
          value={scopeValue}
          onChange={onScopeChange}
          options={
            scopeOptions.length
              ? scopeOptions
              : [{ value: "", label: "Loading…" }]
          }
        />
        {(!needsScope || scopeValue) ? (
          <Button onPress={onAdd}>Assign shift</Button>
        ) : null}
      </View>

      {needsScope && !scopeValue ? (
        <AppCard>
          <Typography variant="medium" muted>
            Select a {scopeLabel.toLowerCase()} to view assignments.
          </Typography>
        </AppCard>
      ) : listQuery.isLoading && !listQuery.data ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : listQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(listQuery.error, "Could not load assignments.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={listQuery.isRefetching && !listQuery.isLoading}
              onRefresh={() => void listQuery.refetch()}
              tintColor={theme.app.dashboard.accentBlue}
            />
          }
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No shift assignments yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 6 }}>
              <Typography variant="medium16" style={{ fontWeight: "600" }}>
                {item.title}
              </Typography>
              <Typography variant="small" muted>
                {item.subtitle}
              </Typography>
              <Button size="compact" variant="ghost" onPress={() => onDelete(item.id)}>
                Remove
              </Button>
            </AppCard>
          )}
        />
      )}

      <FormModal
        open={modalOpen}
        title="Assign shift"
        onClose={onCloseModal}
        onSave={() => void onSave()}
        primaryButtonLabel={saving ? "Saving…" : "Assign"}
        primaryButtonDisabled={saving}
      >
        <View style={{ gap: 12 }}>
          {extraModalFields}
          <SelectField
            label="Shift"
            value={shiftId}
            onChange={onShiftChange}
            options={shiftOptions.length ? shiftOptions : [{ value: "", label: "Loading…" }]}
          />
        </View>
      </FormModal>

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Remove assignment?"
        description="This removes the shift assignment."
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={deleting}
        onDismiss={onDismissDelete}
        onConfirm={() => void onConfirmDelete()}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
});
