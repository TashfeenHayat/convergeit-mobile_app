import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";

import type { JsonRecord } from "@/api/types/common.types";
import { FormModal, InputField, SegmentedControl, SelectField, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { sessionMayPickInternalUserScope, useAuth, type SessionScopeUser } from "@/lib/auth";
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from "@/lib/companies/scope-tree-options";
import { useCompaniesByResellerQuery, useCompaniesSetupResellersQuery } from "@/lib/hooks/query/companies";
import {
  useCreateDepartmentMutation,
  useDepartmentQuery,
  useUpdateDepartmentMutation,
} from "@/lib/hooks/query/hrms/departments";
import { isRecord, pickStr } from "@/lib/utils/core";

export type DepartmentRow = {
  id: string;
  name: string;
  type: "Internal" | "External";
  resellerId?: string;
  parentCompanyId?: string;
};

export type AddDepartmentModalProps = {
  open: boolean;
  onClose: () => void;
  editDepartment?: DepartmentRow | null;
  onSaved?: () => void;
};

export function AddDepartmentModal({
  open,
  onClose,
  editDepartment = null,
  onSaved,
}: AddDepartmentModalProps) {
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = sessionMayPickInternalUserScope(isPlatformAdmin, authUser as SessionScopeUser | null);
  const editId = editDepartment?.id?.trim() ?? "";
  const isEdit = editId.length > 0;

  const [name, setName] = useState("");
  const [departmentType, setDepartmentType] = useState<"Internal" | "External">("Internal");
  const [resellerId, setResellerId] = useState("");
  const [parentCompanyId, setParentCompanyId] = useState("");

  const createMutation = useCreateDepartmentMutation();
  const updateMutation = useUpdateDepartmentMutation();
  const detailQuery = useDepartmentQuery(editId, {
    enabled: open && isEdit,
    scope: "add-department-modal",
    skipGlobalToast: true,
  });

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && departmentType === "External" && mayPickInternal,
  });
  const companiesQuery = useCompaniesByResellerQuery(
    resellerId,
    { view: "tree", sortBy: "name", sortOrder: "asc", all: true },
    { enabled: open && departmentType === "External" && Boolean(resellerId.trim()) },
  );

  const resellerOptions = useMemo(
    () =>
      pickItemsArray(resellersQuery.data)
        .map((row) => toIdNameOption(row))
        .filter((x): x is { label: string; value: string } => x !== null),
    [resellersQuery.data],
  );

  const parentOptions = useMemo(
    () => extractParentCompaniesFromByResellerTree(companiesQuery.data),
    [companiesQuery.data],
  );

  useEffect(() => {
    if (!open || isEdit) return;
    setName("");
    setDepartmentType(mayPickInternal ? "Internal" : "External");
    setResellerId("");
    setParentCompanyId("");
  }, [open, isEdit, mayPickInternal]);

  useEffect(() => {
    if (!open || !isEdit) return;
    if (editDepartment) {
      setName(editDepartment.name);
      setDepartmentType(editDepartment.type);
      setResellerId(editDepartment.resellerId ?? "");
      setParentCompanyId(editDepartment.parentCompanyId ?? "");
      return;
    }
    if (detailQuery.data) {
      const row = isRecord(detailQuery.data)
        ? detailQuery.data
        : isRecord((detailQuery.data as JsonRecord).data)
          ? ((detailQuery.data as JsonRecord).data as JsonRecord)
          : null;
      if (!row) return;
      setName(pickStr(row, ["name"]) || "");
      setDepartmentType(pickStr(row, ["type"]) === "External" ? "External" : "Internal");
      setResellerId(pickStr(row, ["resellerId"]) || "");
      setParentCompanyId(pickStr(row, ["parentCompanyId"]) || "");
    }
  }, [open, isEdit, editDepartment, detailQuery.data]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Department name is required.");
      return;
    }
    if (departmentType === "External") {
      if (!resellerId.trim()) {
        Alert.alert("Validation", "Select a reseller.");
        return;
      }
      if (!parentCompanyId.trim()) {
        Alert.alert("Validation", "Select a parent company.");
        return;
      }
    }

    const body: JsonRecord = { name: trimmed, type: departmentType };
    if (departmentType === "External") {
      body.resellerId = resellerId.trim();
      body.parentCompanyId = parentCompanyId.trim();
    } else if (isEdit) {
      body.resellerId = null;
      body.parentCompanyId = null;
    }

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editId, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert("Save failed", extractApiErrorMessage(err));
    }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <FormModal
      open={open}
      title={isEdit ? "Edit department" : "Add department"}
      description="Internal departments are platform-wide. External departments belong to a reseller and parent company."
      onClose={onClose}
      onSave={() => void save()}
      primaryButtonLabel={isEdit ? "Save" : "Create"}
      primaryButtonDisabled={saving || (isEdit && detailQuery.isLoading)}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
        {mayPickInternal ? (
          <SegmentedControl
            value={departmentType}
            onChange={(v) => setDepartmentType(v as "Internal" | "External")}
            options={[
              { value: "Internal", label: "Internal" },
              { value: "External", label: "External" },
            ]}
          />
        ) : null}

        <InputField label="Department name" value={name} onChangeText={setName} />

        {departmentType === "External" ? (
          <>
            {mayPickInternal ? (
              <SelectField
                label="Reseller"
                value={resellerId}
                onChange={setResellerId}
                options={
                  resellerOptions.length
                    ? resellerOptions
                    : [{ value: "", label: resellersQuery.isLoading ? "Loading…" : "No resellers" }]
                }
              />
            ) : null}
            <SelectField
              label="Parent company"
              value={parentCompanyId}
              onChange={setParentCompanyId}
              options={
                parentOptions.length
                  ? parentOptions
                  : [{ value: "", label: companiesQuery.isLoading ? "Loading…" : "Select reseller first" }]
              }
            />
          </>
        ) : null}

        {isEdit && detailQuery.isLoading ? (
          <Typography variant="small" muted>
            Loading department…
          </Typography>
        ) : null}
      </ScrollView>
    </FormModal>
  );
}
