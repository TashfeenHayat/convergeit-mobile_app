import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Checkbox,
  FormModal,
  SearchBar,
  SelectField,
  Typography,
} from '@/components/ui';
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
  useAddPoolMembersBulkMutation,
  usePoolsListQuery,
} from '@/lib/hooks/query/hrms';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { useAppTheme } from '@/theme';

export type AddPoolMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * Add pool member — web hub parity (`PoolsPageView` hub add).
 * Internal open: departments?type=Internal&all=true, pools?departmentType=Internal&all=true,
 * users?all=true&userType=Internal&unassignedPoolOnly=true&headRole=none
 */
export function AddPoolMemberModal({
  open,
  onClose,
  onSaved,
}: AddPoolMemberModalProps) {
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

  const [deptKind, setDeptKind] = useState<'Internal' | 'External'>('Internal');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [poolId, setPoolId] = useState('');
  const [userIds, setUserIds] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchApplied, setSearchApplied] = useState('');

  const bulkMutation = useAddPoolMembersBulkMutation();

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && deptKind === 'External',
  });
  const parentCompaniesQuery = useCompaniesByResellerQuery(
    resellerId.trim(),
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled: open && deptKind === 'External' && Boolean(resellerId.trim()),
    },
  );

  /** GET /hrms/departments?type=Internal&all=true */
  const internalDepartmentsQuery = useDepartmentsListQuery(
    { type: 'Internal', all: true },
    {
      enabled: open && deptKind === 'Internal',
      scope: 'hub-add-pm-int-dept',
    },
  );

  const externalDepartmentsQuery = useDepartmentsListQuery(
    {
      all: true,
      type: 'External',
      parentCompanyId: parentCompanyId.trim(),
    },
    {
      enabled:
        open &&
        deptKind === 'External' &&
        Boolean(resellerId.trim()) &&
        Boolean(parentCompanyId.trim()),
      scope: 'hub-add-pm-ext-dept',
    },
  );

  /** GET /hrms/pools?departmentType=Internal&all=true */
  const poolsQuery = usePoolsListQuery(
    open
      ? deptKind === 'Internal'
        ? { departmentType: 'Internal', all: true }
        : departmentId.trim()
          ? { departmentId: departmentId.trim(), all: true }
          : undefined
      : undefined,
    {
      enabled:
        open &&
        (deptKind === 'Internal' || Boolean(departmentId.trim())),
      scope: 'hub-add-pm-pools',
    },
  );

  /** GET /users?all=true&userType=Internal&unassignedPoolOnly=true&headRole=none */
  const internalUsersQuery = useUsersListQuery(
    open && deptKind === 'Internal'
      ? {
          all: true,
          userType: 'Internal',
          unassignedPoolOnly: true,
          headRole: 'none',
          ...(departmentId.trim() ? { departmentId: departmentId.trim() } : {}),
        }
      : undefined,
    { enabled: open && deptKind === 'Internal' },
  );

  const externalUsersQuery = useUsersListQuery(
    open &&
      deptKind === 'External' &&
      resellerId.trim() &&
      parentCompanyId.trim()
      ? {
          all: true,
          userType: 'External',
          unassignedPoolOnly: true,
          headRole: 'none',
          parentCompanyId: parentCompanyId.trim(),
          ...(departmentId.trim() ? { departmentId: departmentId.trim() } : {}),
        }
      : undefined,
    {
      enabled:
        open &&
        deptKind === 'External' &&
        Boolean(resellerId.trim()) &&
        Boolean(parentCompanyId.trim()),
    },
  );

  const usersQuery =
    deptKind === 'Internal' ? internalUsersQuery : externalUsersQuery;
  const usersLoading = usersQuery.isLoading || usersQuery.isFetching;
  const usersError = usersQuery.isError;

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
    const base = extractParentCompaniesFromByResellerTree(
      parentCompaniesQuery.data,
    );
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
    const q =
      deptKind === 'Internal'
        ? internalDepartmentsQuery
        : externalDepartmentsQuery;
    const base = pickApiItems(q.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        if (!id) return null;
        return { value: id, label: pickStr(r, ['name']) || id };
      })
      .filter((x): x is { value: string; label: string } => x !== null);

    if (deptKind === 'Internal') {
      return [
        {
          value: '',
          label: q.isLoading
            ? 'Loading departments…'
            : '— All departments (optional) —',
        },
        ...base,
      ];
    }
    return [
      {
        value: '',
        label:
          !resellerId.trim() || !parentCompanyId.trim()
            ? 'Select reseller & parent first'
            : q.isLoading
              ? 'Loading departments…'
              : '— Select department —',
      },
      ...base,
    ];
  }, [
    deptKind,
    internalDepartmentsQuery.data,
    internalDepartmentsQuery.isLoading,
    externalDepartmentsQuery.data,
    externalDepartmentsQuery.isLoading,
    resellerId,
    parentCompanyId,
  ]);

  const poolOptions = useMemo(() => {
    const base = pickApiItems(poolsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        if (!id) return null;
        return {
          value: id,
          label: pickStr(r, ['name', 'poolName', 'title']) || id,
        };
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label:
          deptKind === 'External' && !departmentId.trim()
            ? 'Select department first'
            : poolsQuery.isLoading
              ? 'Loading pools…'
              : '— Select pool —',
      },
      ...base,
    ];
  }, [
    poolsQuery.data,
    poolsQuery.isLoading,
    deptKind,
    departmentId,
  ]);

  const userRows = useMemo(
    () => extractUsersRows(usersQuery.data),
    [usersQuery.data],
  );

  const filteredUserRows = useMemo(() => {
    const q = searchApplied.trim().toLowerCase();
    if (!q) return userRows;
    return userRows.filter((row) => {
      const hay = `${row.user} ${row.email} ${row.department}`.toLowerCase();
      return hay.includes(q);
    });
  }, [userRows, searchApplied]);

  const resetForm = () => {
    setDeptKind(mayPickInternal ? 'Internal' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    setPoolId('');
    setUserIds([]);
    setSearchInput('');
    setSearchApplied('');
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, mayPickInternal]);

  useEffect(() => {
    if (!open || mayPickInternal) return;
    setDeptKind('External');
  }, [open, mayPickInternal]);

  const description = mayPickInternal
    ? 'Choose the target pool, select one or more users, then confirm. Pool heads are excluded. Internal users load by default; external flows need reseller and parent company first.'
    : 'Choose the target pool, select one or more users, then confirm. Pool heads are excluded. Select reseller and parent company first to load users.';

  const handleClose = () => {
    if (bulkMutation.isPending) return;
    resetForm();
    onClose();
  };

  const toggleUser = (id: string) => {
    setUserIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!poolId.trim()) {
      Alert.alert('Validation', 'Select a pool.');
      return;
    }
    if (userIds.length === 0) {
      Alert.alert('Validation', 'Select one or more users.');
      return;
    }
    try {
      await bulkMutation.mutateAsync({
        poolId: poolId.trim(),
        userIds: [...userIds],
      });
      resetForm();
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert(
        'Add failed',
        extractApiErrorMessage(err, 'Could not add pool members.'),
      );
    }
  };

  const primaryLabel = bulkMutation.isPending
    ? 'Adding…'
    : userIds.length > 1
      ? `Add ${userIds.length} to pool`
      : 'Add to pool';

  const usersReady =
    deptKind === 'Internal' ||
    (Boolean(resellerId.trim()) && Boolean(parentCompanyId.trim()));

  return (
    <FormModal
      open={open}
      title="Add pool member"
      description={description}
      onClose={handleClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={primaryLabel}
      primaryButtonDisabled={
        bulkMutation.isPending || !poolId.trim() || userIds.length === 0
      }
      cancelButtonLabel="Cancel"
    >
      <View style={{ gap: 14 }}>
        <View style={styles.resetRow}>
          <Button
            variant="ghost"
            size="compact"
            disabled={bulkMutation.isPending}
            onPress={resetForm}
          >
            Reset all fields
          </Button>
        </View>

        <View
          style={[
            styles.section,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <Typography
            variant="small"
            muted
            style={styles.sectionLabel}
          >
            TARGET POOL
          </Typography>
          <View style={{ gap: 12, marginTop: 12 }}>
            <SelectField
              label="Department type"
              value={deptKind}
              onChange={(v) => {
                const next = v === 'External' ? 'External' : 'Internal';
                setDeptKind(next);
                setResellerId('');
                setParentCompanyId('');
                setDepartmentId('');
                setPoolId('');
                setUserIds([]);
                setSearchInput('');
                setSearchApplied('');
              }}
              options={typeOptions}
              disabled={bulkMutation.isPending || typeOptions.length === 1}
            />

            {deptKind === 'External' ? (
              <>
                <SelectField
                  label="Reseller"
                  value={resellerId}
                  onChange={(v) => {
                    setResellerId(v);
                    setParentCompanyId('');
                    setDepartmentId('');
                    setPoolId('');
                    setUserIds([]);
                    setSearchApplied('');
                  }}
                  options={resellerOptions}
                  disabled={bulkMutation.isPending}
                />
                <SelectField
                  label="Parent company"
                  value={parentCompanyId}
                  onChange={(v) => {
                    setParentCompanyId(v);
                    setDepartmentId('');
                    setPoolId('');
                    setUserIds([]);
                    setSearchApplied('');
                  }}
                  options={parentCompanyOptions}
                  disabled={bulkMutation.isPending || !resellerId.trim()}
                />
              </>
            ) : null}

            <SelectField
              label={
                deptKind === 'Internal'
                  ? 'Department (optional)'
                  : 'Department'
              }
              value={departmentId}
              onChange={(v) => {
                setDepartmentId(v);
                if (deptKind === 'External') setPoolId('');
                setUserIds([]);
                setSearchApplied('');
              }}
              options={departmentOptions}
              disabled={
                bulkMutation.isPending ||
                (deptKind === 'External' &&
                  (!resellerId.trim() || !parentCompanyId.trim()))
              }
            />

            <SelectField
              label="Pool"
              value={poolId}
              onChange={(v) => {
                setPoolId(v);
                setUserIds([]);
              }}
              options={poolOptions}
              disabled={
                bulkMutation.isPending ||
                (deptKind === 'External' && !departmentId.trim())
              }
            />
          </View>
        </View>

        <View
          style={[
            styles.section,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={styles.userHeader}>
            <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
              <Typography variant="small" muted style={styles.sectionLabel}>
                USER
              </Typography>
              <Typography variant="small" muted>
                Click rows to select one or more people. Pool heads are not
                listed. Search narrows the list.
              </Typography>
            </View>
            {userRows.length > 0 && !usersLoading ? (
              <Typography variant="small" muted style={{ fontWeight: '600' }}>
                {searchApplied.trim()
                  ? `${filteredUserRows.length} / ${userRows.length}`
                  : `${userRows.length} loaded`}
              </Typography>
            ) : null}
          </View>

          <View style={styles.searchRow}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search name or email…"
              style={{ flex: 1 }}
              onSubmit={() => {
                setSearchApplied(searchInput.trim());
                setUserIds([]);
              }}
            />
            <Button
              variant="primary"
              size="compact"
              disabled={
                usersLoading ||
                searchInput.trim() === searchApplied.trim()
              }
              onPress={() => {
                setSearchApplied(searchInput.trim());
                setUserIds([]);
              }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              size="compact"
              disabled={!searchApplied.trim() && !searchInput.trim()}
              onPress={() => {
                setSearchInput('');
                setSearchApplied('');
              }}
            >
              Clear search
            </Button>
          </View>

          <View
            style={[
              styles.usersBox,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            {!usersReady ? (
              <Typography variant="small" muted>
                Select reseller and parent company to load users.
              </Typography>
            ) : usersLoading ? (
              <Typography variant="small" muted>
                Loading users…
              </Typography>
            ) : usersError ? (
              <Typography
                variant="small"
                style={{ color: theme.app.dashboard.accentRed }}
              >
                Could not load users. Try again.
              </Typography>
            ) : filteredUserRows.length === 0 ? (
              <Typography variant="small" muted>
                No users for this filter.
              </Typography>
            ) : (
              <View style={{ gap: 4 }}>
                <View style={styles.tableHeader}>
                  <View style={styles.checkCol} />
                  <Typography
                    variant="small"
                    muted
                    style={[styles.colUser, { fontWeight: '700' }]}
                  >
                    User
                  </Typography>
                  <Typography
                    variant="small"
                    muted
                    style={[styles.colDept, { fontWeight: '700' }]}
                  >
                    Department
                  </Typography>
                </View>
                {filteredUserRows.map((row) => {
                  const selected = userIds.includes(row.id);
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => toggleUser(row.id)}
                      style={({ pressed }) => [
                        styles.userRow,
                        {
                          borderColor: selected
                            ? `${accent}88`
                            : theme.app.dashboard.cardBorder,
                          backgroundColor: selected
                            ? `${accent}18`
                            : 'transparent',
                          opacity: pressed ? 0.92 : 1,
                        },
                      ]}
                    >
                      <View style={styles.checkCol} pointerEvents="none">
                        <Checkbox checked={selected} />
                      </View>
                      <View style={[styles.colUser, { gap: 2 }]}>
                        <Typography
                          variant="small"
                          style={{ fontWeight: '700' }}
                        >
                          {row.user || row.email || row.id}
                        </Typography>
                        <Typography variant="small" muted numberOfLines={1}>
                          {row.email} · {row.type}
                        </Typography>
                      </View>
                      <Typography
                        variant="small"
                        muted
                        style={styles.colDept}
                        numberOfLines={2}
                      >
                        {row.department || '—'}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  resetRow: {
    alignItems: 'flex-end',
  },
  section: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  usersBox: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 160,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  checkCol: {
    width: 28,
    alignItems: 'center',
  },
  colUser: {
    flex: 1.4,
    minWidth: 0,
  },
  colDept: {
    flex: 1,
    minWidth: 0,
  },
});
