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
import { useCreatePoolMutation } from '@/lib/hooks/query/hrms/pools';

export type AddPoolModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * Add pool — web parity (`PoolModals` create).
 * Internal: pool type + name only (no reseller / parent / department).
 */
export function AddPoolModal({ open, onClose, onSaved }: AddPoolModalProps) {
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );

  const [poolKind, setPoolKind] = useState<'Internal' | 'External'>('Internal');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [poolName, setPoolName] = useState('');

  const createMutation = useCreatePoolMutation();

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && poolKind === 'External',
  });
  const parentCompaniesQuery = useCompaniesByResellerQuery(
    resellerId.trim(),
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled: open && poolKind === 'External' && Boolean(resellerId.trim()),
    },
  );
  const externalDepartmentsQuery = useDepartmentsListQuery(
    resellerId.trim() && parentCompanyId.trim()
      ? {
          all: true,
          type: 'External',
          resellerId: resellerId.trim(),
          parentCompanyId: parentCompanyId.trim(),
        }
      : undefined,
    {
      enabled:
        open &&
        poolKind === 'External' &&
        Boolean(resellerId.trim()) &&
        Boolean(parentCompanyId.trim()),
      scope: 'add-pool-modal-ext-dept',
    },
  );

  const typeOptions = useMemo(
    () =>
      mayPickInternal
        ? [
            { value: 'Internal', label: 'Internal' },
            { value: 'External', label: 'External' },
          ]
        : [{ value: 'External', label: 'External' }],
    [mayPickInternal],
  );

  const resellerOptions = useMemo(() => {
    const base = pickItemsArray(resellersQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: resellersQuery.isLoading
          ? 'Loading resellers…'
          : '— Select reseller —',
      },
      ...base,
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentCompanyOptions = useMemo(() => {
    const base = extractParentCompaniesFromByResellerTree(parentCompaniesQuery.data);
    return [
      {
        value: '',
        label: !resellerId.trim()
          ? 'Select reseller first'
          : parentCompaniesQuery.isLoading
            ? 'Loading parent companies…'
            : '— Select parent company —',
      },
      ...base,
    ];
  }, [parentCompaniesQuery.data, parentCompaniesQuery.isLoading, resellerId]);

  const departmentOptions = useMemo(() => {
    const base = pickItemsArray(externalDepartmentsQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: externalDepartmentsQuery.isLoading
          ? 'Loading departments…'
          : '— Select department —',
      },
      ...base,
    ];
  }, [externalDepartmentsQuery.data, externalDepartmentsQuery.isLoading]);

  const description = mayPickInternal
    ? poolKind === 'Internal'
      ? 'Internal pool: enter the pool name only. No reseller, parent company, or department is required.'
      : 'External pool: choose reseller and parent company, then department, then pool name.'
    : 'Choose reseller and parent company, then department, then pool name (external departments).';

  const saveDisabled = useMemo(() => {
    if (!poolName.trim()) return true;
    if (poolKind === 'External') {
      if (!resellerId.trim() || !parentCompanyId.trim()) return true;
      if (!departmentId.trim()) return true;
    }
    return false;
  }, [poolName, poolKind, resellerId, parentCompanyId, departmentId]);

  const reset = () => {
    setPoolKind(mayPickInternal ? 'Internal' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    setPoolName('');
  };

  useEffect(() => {
    if (!open) return;
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open
  }, [open, mayPickInternal]);

  useEffect(() => {
    if (!open || mayPickInternal) return;
    setPoolKind('External');
  }, [open, mayPickInternal]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    reset();
    onClose();
  };

  const handleSave = async () => {
    const name = poolName.trim();
    if (!name) {
      Alert.alert('Validation', 'Pool name is required.');
      return;
    }
    if (poolKind === 'External' && !departmentId.trim()) {
      Alert.alert('Validation', 'Select a department.');
      return;
    }
    const body: Record<string, string> = {
      poolKind,
      name,
    };
    if (poolKind === 'External') {
      body.departmentId = departmentId.trim();
    }
    try {
      await createMutation.mutateAsync(body);
      reset();
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err, 'Could not create pool.'));
    }
  };

  return (
    <FormModal
      open={open}
      title="Add pool"
      description={description}
      onClose={handleClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={createMutation.isPending ? 'Saving…' : 'Save pool'}
      primaryButtonDisabled={createMutation.isPending || saveDisabled}
      cancelButtonLabel="Close"
    >
      <View style={{ gap: 12 }}>
        <SelectField
          label="Pool type"
          value={poolKind}
          onChange={(v) => {
            const next = v === 'External' ? 'External' : 'Internal';
            setPoolKind(next);
            setResellerId('');
            setParentCompanyId('');
            setDepartmentId('');
          }}
          options={typeOptions}
          disabled={createMutation.isPending || typeOptions.length === 1}
        />

        {poolKind === 'External' ? (
          <>
            <SelectField
              label="Reseller"
              value={resellerId}
              onChange={(v) => {
                setResellerId(v);
                setParentCompanyId('');
                setDepartmentId('');
              }}
              options={resellerOptions}
              disabled={createMutation.isPending}
            />
            <SelectField
              label="Parent company"
              value={parentCompanyId}
              onChange={(v) => {
                setParentCompanyId(v);
                setDepartmentId('');
              }}
              options={parentCompanyOptions}
              disabled={createMutation.isPending || !resellerId.trim()}
            />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={setDepartmentId}
              options={departmentOptions}
              disabled={
                createMutation.isPending ||
                !resellerId.trim() ||
                !parentCompanyId.trim()
              }
            />
          </>
        ) : null}

        <InputField
          label="Pool name"
          placeholder="e.g. Team Alpha"
          value={poolName}
          onChangeText={setPoolName}
          editable={!createMutation.isPending}
        />
      </View>
    </FormModal>
  );
}
