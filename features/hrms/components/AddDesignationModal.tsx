import { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { FormModal, InputField, SelectField } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import {
  useCompaniesByResellerQuery,
  useCompaniesSetupResellersQuery,
} from '@/lib/hooks/query/companies';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import {
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
} from '@/lib/hooks/query/hrms/designations';
import { extractNestFieldErrors } from '@/lib/companies/extract-nest-field-errors';

export type DesignationEditRow = {
  id: string;
  name: string;
  departmentId: string;
};

export type AddDesignationModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editDesignation?: DesignationEditRow | null;
};

/**
 * Add / Edit Designation — web parity.
 * On Add with Internal type: GET /hrms/departments?type=Internal&all=true
 */
export function AddDesignationModal({
  open,
  onClose,
  onSaved,
  editDesignation = null,
}: AddDesignationModalProps) {
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternalDeptType = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );

  const editId = editDesignation?.id?.trim() ?? '';
  const isEdit = editId.length > 0;

  const [name, setName] = useState('');
  const [deptKind, setDeptKind] = useState<'Internal' | 'External'>('Internal');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateDesignationMutation();
  const updateMutation = useUpdateDesignationMutation();
  const savePending = createMutation.isPending || updateMutation.isPending;

  const clearFieldError = (...keys: string[]) => {
    setFieldErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const key of keys) {
        if (!next[key]) continue;
        delete next[key];
        changed = true;
      }
      return changed ? next : prev;
    });
  };

  /** Screenshot / web: GET /hrms/departments?type=Internal&all=true */
  const internalDepartmentsQuery = useDepartmentsListQuery(
    { type: 'Internal', all: true },
    {
      enabled: open && deptKind === 'Internal',
      scope: 'add-designation-modal-int-dept',
    },
  );

  const externalDeptListParams = useMemo(() => {
    const params: Record<string, string | boolean> = {
      all: true,
      type: 'External',
    };
    const rid = resellerId.trim();
    if (rid) {
      params.resellerId = rid;
      const pid = parentCompanyId.trim();
      if (pid) params.parentCompanyId = pid;
    }
    return params;
  }, [resellerId, parentCompanyId]);

  const externalDepartmentsQuery = useDepartmentsListQuery(externalDeptListParams, {
    enabled: open && deptKind === 'External',
    scope: 'add-designation-modal-ext-dept',
  });

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && deptKind === 'External',
  });
  const companiesByResellerQuery = useCompaniesByResellerQuery(
    resellerId,
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled: open && deptKind === 'External' && resellerId.trim().length > 0,
    },
  );

  const departmentsQuery =
    deptKind === 'Internal' ? internalDepartmentsQuery : externalDepartmentsQuery;

  const departmentTypeOptions = useMemo(() => {
    if (mayPickInternalDeptType) {
      return [
        { value: 'Internal', label: 'Internal' },
        { value: 'External', label: 'External' },
      ];
    }
    return [{ value: 'External', label: 'External' }];
  }, [mayPickInternalDeptType]);

  const departmentSelectOptions = useMemo(() => {
    const options = pickItemsArray(departmentsQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    if (options.length > 0) return options;
    return departmentsQuery.isLoading
      ? [{ value: '', label: 'Loading…' }]
      : [{ value: '', label: 'No departments available' }];
  }, [departmentsQuery.data, departmentsQuery.isLoading]);

  const resellerSelectOptions = useMemo(() => {
    const options = pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    const allRow = { value: '', label: 'All resellers' };
    if (options.length > 0) return [allRow, ...options];
    return [
      {
        value: '',
        label: resellersQuery.isLoading ? 'Loading resellers…' : 'All resellers',
      },
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentSelectOptions = useMemo(() => {
    if (!resellerId.trim()) {
      return [{ value: '', label: 'Choose a reseller first' }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(
      companiesByResellerQuery.data,
    );
    if (companiesByResellerQuery.isLoading && extracted.length === 0) {
      return [{ value: '', label: 'Loading parent companies…' }];
    }
    const allRow = { value: '', label: 'All parent companies' };
    if (extracted.length > 0) return [allRow, ...extracted];
    return [{ value: '', label: 'No parent companies' }];
  }, [resellerId, companiesByResellerQuery.isLoading, companiesByResellerQuery.data]);

  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      return;
    }
    setFieldErrors({});
    if (isEdit && editDesignation) {
      setName(editDesignation.name === '—' ? '' : editDesignation.name);
      setDepartmentId(editDesignation.departmentId);
      setDeptKind(mayPickInternalDeptType ? 'Internal' : 'External');
      setResellerId('');
      setParentCompanyId('');
      return;
    }
    setName('');
    setDeptKind(mayPickInternalDeptType ? 'Internal' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
  }, [open, isEdit, editDesignation, mayPickInternalDeptType]);

  const handleDeptKindChange = (v: string) => {
    const next = v === 'External' ? 'External' : 'Internal';
    setDeptKind(next);
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    clearFieldError('departmentId');
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    const nextErrors: Record<string, string> = {};
    if (!trimmed) nextErrors.name = 'Please enter a designation name.';
    if (!departmentId.trim()) nextErrors.departmentId = 'Please select a department.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    const body = { name: trimmed, departmentId: departmentId.trim() };
    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editId, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.name && !fields.designationName) fields.designationName = fields.name;
      if (fields.designationName && !fields.name) fields.name = fields.designationName;
      if (Object.keys(fields).length > 0) setFieldErrors(fields);
      Alert.alert('Save failed', extractApiErrorMessage(err, 'Could not save designation.'));
    }
  };

  const nameError = fieldErrors.name?.trim() || fieldErrors.designationName?.trim() || '';
  const modalDescription = isEdit
    ? 'Review the designation details, update the fields, and save your changes.'
    : mayPickInternalDeptType
      ? 'Choose department type, pick a department, then enter the designation name. Reseller and parent company are optional for external departments.'
      : 'Pick an external department, then enter the designation name. Reseller and parent company are optional to narrow the list.';

  return (
    <FormModal
      open={open}
      title={isEdit ? 'Edit Designation' : 'Add Designation'}
      description={modalDescription}
      onClose={onClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={isEdit ? 'Save changes' : 'Save'}
      primaryButtonDisabled={savePending}
      cancelButtonLabel="Cancel"
    >
      <View style={{ gap: 12 }}>
        <SelectField
          label="Department type"
          value={deptKind}
          onChange={handleDeptKindChange}
          options={departmentTypeOptions}
          disabled={savePending || departmentTypeOptions.length === 1}
        />

        {deptKind === 'External' ? (
          <>
            <SelectField
              label="Reseller (optional)"
              value={resellerId}
              onChange={(v) => {
                setResellerId(v);
                setParentCompanyId('');
                setDepartmentId('');
                clearFieldError('departmentId');
              }}
              options={resellerSelectOptions}
              disabled={savePending}
            />
            <SelectField
              label="Parent company (optional)"
              value={parentCompanyId}
              onChange={(v) => {
                setParentCompanyId(v);
                setDepartmentId('');
                clearFieldError('departmentId');
              }}
              options={parentSelectOptions}
              disabled={savePending || !resellerId.trim()}
            />
          </>
        ) : null}

        <SelectField
          label="Department"
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            clearFieldError('departmentId');
          }}
          options={departmentSelectOptions}
          placeholder="Select department"
          disabled={savePending}
          error={Boolean(fieldErrors.departmentId)}
          helperText={fieldErrors.departmentId}
        />

        <InputField
          label="Designation Name"
          placeholder="e.g. Senior Manager"
          value={name}
          onChangeText={(text) => {
            setName(text);
            clearFieldError('name', 'designationName');
          }}
          editable={!savePending}
          error={Boolean(nameError)}
          helperText={nameError || undefined}
        />
      </View>
    </FormModal>
  );
}
