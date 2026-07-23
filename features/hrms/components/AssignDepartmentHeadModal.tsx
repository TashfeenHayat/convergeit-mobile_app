import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, FormModal, SelectField, Typography } from '@/components/ui';
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
import { useAssignDepartmentHeadMutation } from '@/lib/hooks/query/hrms';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { useAppTheme } from '@/theme';

export type AssignDepartmentHeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * Assign department head — web parity.
 * External (default): GET /companies/setup/resellers when modal opens.
 */
export function AssignDepartmentHeadModal({
  open,
  onClose,
  onSaved,
}: AssignDepartmentHeadModalProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );

  const [userType, setUserType] = useState<'Internal' | 'External'>('External');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [userId, setUserId] = useState('');

  const assignMutation = useAssignDepartmentHeadMutation();

  /** Screenshot / network: GET /companies/setup/resellers when External + open */
  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && userType === 'External',
  });

  const parentCompaniesQuery = useCompaniesByResellerQuery(
    resellerId.trim(),
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled: open && userType === 'External' && Boolean(resellerId.trim()),
    },
  );

  const internalDepartmentsQuery = useDepartmentsListQuery(
    { all: true, type: 'Internal' },
    {
      enabled: open && userType === 'Internal',
      scope: 'department-heads-assign-internal-departments',
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
        userType === 'External' &&
        Boolean(resellerId.trim()) &&
        Boolean(parentCompanyId.trim()),
      scope: 'department-heads-assign-external-departments',
    },
  );

  const usersQuery = useUsersListQuery(
    open
      ? {
          all: true,
          userType,
          ...(departmentId.trim() ? { departmentId: departmentId.trim() } : {}),
          ...(userType === 'External' && parentCompanyId.trim()
            ? { parentCompanyId: parentCompanyId.trim() }
            : {}),
        }
      : undefined,
    {
      enabled:
        open &&
        Boolean(departmentId.trim()) &&
        (userType === 'Internal' ||
          (Boolean(resellerId.trim()) && Boolean(parentCompanyId.trim()))),
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
        label:
          resellerId.trim().length === 0
            ? 'Select reseller first'
            : parentCompaniesQuery.isLoading
              ? 'Loading parent companies…'
              : '— Select parent company —',
      },
      ...base,
    ];
  }, [parentCompaniesQuery.data, parentCompaniesQuery.isLoading, resellerId]);

  const departmentOptions = useMemo(() => {
    const source =
      userType === 'Internal'
        ? internalDepartmentsQuery.data
        : externalDepartmentsQuery.data;
    const loading =
      userType === 'Internal'
        ? internalDepartmentsQuery.isLoading
        : externalDepartmentsQuery.isLoading;
    const base = pickItemsArray(source)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    const prompt =
      userType === 'External' && !parentCompanyId.trim()
        ? 'Select parent company first'
        : loading
          ? 'Loading departments…'
          : '— Select department —';
    return [{ value: '', label: prompt }, ...base];
  }, [
    userType,
    internalDepartmentsQuery.data,
    internalDepartmentsQuery.isLoading,
    externalDepartmentsQuery.data,
    externalDepartmentsQuery.isLoading,
    parentCompanyId,
  ]);

  const userRows = useMemo(() => {
    const rows = extractUsersRows(usersQuery.data);
    if (userType !== 'External') return rows;
    const pid = parentCompanyId.trim();
    return rows.filter((row) => row.parentCompanyId === pid);
  }, [usersQuery.data, userType, parentCompanyId]);

  const usersLoading = usersQuery.isLoading || usersQuery.isFetching;

  const clearAssignModal = () => {
    setUserType(mayPickInternal ? 'External' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    setUserId('');
  };

  useEffect(() => {
    if (!open) return;
    clearAssignModal();
    if (!mayPickInternal) setUserType('External');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, mayPickInternal]);

  useEffect(() => {
    if (userType === 'Internal') {
      setResellerId('');
      setParentCompanyId('');
    }
    setDepartmentId('');
    setUserId('');
  }, [userType]);

  const description = mayPickInternal
    ? 'User must be in the selected department on the server. Choose Internal / External and pick one user.'
    : 'User must be in the selected department on the server. External users only — choose reseller and parent company, then department, then pick one user.';

  const handleClose = () => {
    if (assignMutation.isPending) return;
    clearAssignModal();
    onClose();
  };

  const handleSave = async () => {
    const dept = departmentId.trim();
    const user = userId.trim();
    if (!dept) {
      Alert.alert('Validation', 'Select a department in the assign dialog.');
      return;
    }
    if (!user) {
      Alert.alert('Validation', 'Select a user from the list.');
      return;
    }
    try {
      await assignMutation.mutateAsync({ departmentId: dept, userId: user });
      clearAssignModal();
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert(
        'Assign failed',
        extractApiErrorMessage(err, 'Could not assign department head.'),
      );
    }
  };

  return (
    <FormModal
      open={open}
      title="Assign department head"
      description={description}
      onClose={handleClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={assignMutation.isPending ? 'Assigning…' : 'Assign'}
      primaryButtonDisabled={
        assignMutation.isPending || !departmentId.trim() || !userId.trim()
      }
      cancelButtonLabel="Close"
    >
      <View style={{ gap: 12 }}>
        <SelectField
          label="Users — type"
          value={userType}
          onChange={(v) => setUserType(v === 'Internal' ? 'Internal' : 'External')}
          options={typeOptions}
          disabled={assignMutation.isPending || typeOptions.length === 1}
        />

        {userType === 'External' ? (
          <>
            <SelectField
              label="Reseller"
              value={resellerId}
              onChange={(v) => {
                setResellerId(v);
                setParentCompanyId('');
                setDepartmentId('');
                setUserId('');
              }}
              options={resellerOptions}
              disabled={assignMutation.isPending}
            />
            <SelectField
              label="Parent company"
              value={parentCompanyId}
              onChange={(v) => {
                setParentCompanyId(v);
                setDepartmentId('');
                setUserId('');
              }}
              options={parentCompanyOptions}
              disabled={assignMutation.isPending || !resellerId.trim()}
            />
          </>
        ) : null}

        <SelectField
          label="Department"
          value={departmentId}
          onChange={(v) => {
            setDepartmentId(v);
            setUserId('');
          }}
          options={departmentOptions}
          disabled={
            assignMutation.isPending ||
            (userType === 'External' && !parentCompanyId.trim())
          }
        />

        <View
          style={[
            styles.usersBox,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          {!departmentId.trim() ? (
            <Typography variant="small" muted>
              Select a department to load users.
            </Typography>
          ) : usersLoading ? (
            <Typography variant="small" muted>
              Loading users…
            </Typography>
          ) : userRows.length === 0 ? (
            <Typography variant="small" muted>
              No users for this filter.
            </Typography>
          ) : (
            <View style={{ gap: 6 }}>
              {userRows.map((row) => {
                const selected = userId === row.id;
                return (
                  <Pressable
                    key={row.id}
                    onPress={() => setUserId(row.id)}
                    style={({ pressed }) => [
                      styles.userRow,
                      {
                        borderColor: selected
                          ? `${accent}88`
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: selected ? `${accent}18` : 'transparent',
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        {
                          borderColor: selected
                            ? accent
                            : theme.app.dashboard.cardBorder,
                        },
                      ]}
                    >
                      {selected ? (
                        <View style={[styles.radioInner, { backgroundColor: accent }]} />
                      ) : null}
                    </View>
                    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                      <Typography variant="small" style={{ fontWeight: '700' }}>
                        {row.user || row.email || row.id}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        {row.email || '—'}
                      </Typography>
                      <Typography variant="small" muted>
                        {row.type || '—'}
                      </Typography>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {userId.trim() ? (
          <Button
            size="compact"
            variant="ghost"
            onPress={() => setUserId('')}
            style={{ alignSelf: 'flex-end' }}
          >
            Clear selection
          </Button>
        ) : null}
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  usersBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    minHeight: 72,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
