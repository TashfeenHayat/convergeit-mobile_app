import Ionicons from '@expo/vector-icons/Ionicons';
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
  useAssignPoolHeadMutation,
  usePoolMembersListQuery,
  usePoolsListQuery,
} from '@/lib/hooks/query/hrms';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

export type AssignPoolHeadModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

type MemberRow = {
  id: string;
  user: string;
  email: string;
  department: string;
};

function poolMemberDisplayName(r: Record<string, unknown>): string {
  const user = isRecord(r.user) ? r.user : null;
  const first =
    pickStr(r, ['firstName', 'first_name']) ||
    pickStr(user, ['firstName', 'first_name']) ||
    '';
  const last =
    pickStr(r, ['lastName', 'last_name']) ||
    pickStr(user, ['lastName', 'last_name']) ||
    '';
  const joined = `${first} ${last}`.trim();
  if (joined) return joined;
  return (
    pickStr(r, ['name', 'fullName', 'userName']) ||
    pickStr(user, ['name', 'fullName', 'userName']) ||
    '—'
  );
}

function parseMemberRows(data: unknown): MemberRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const user = isRecord(r.user) ? r.user : null;
      const id =
        pickStr(r, ['userId', 'user_id', 'id']) ||
        pickStr(user, ['id']) ||
        '';
      if (!id) return null;
      const poolObj = isRecord(r.pool) ? r.pool : null;
      const nestedDept =
        poolObj && isRecord(poolObj.department) ? poolObj.department : null;
      return {
        id,
        user: poolMemberDisplayName(r),
        email:
          pickStr(r, ['email']) || pickStr(user, ['email']) || '—',
        department:
          pickStr(r, ['poolDepartmentName', 'departmentName']) ||
          pickStr(nestedDept, ['name']) ||
          '—',
      };
    })
    .filter((x): x is MemberRow => x !== null);
}

/**
 * Assign pool head — web parity.
 * Internal open: GET /hrms/pools?all=true&departmentType=Internal
 * + GET /hrms/departments?all=true&type=Internal
 */
export function AssignPoolHeadModal({
  open,
  onClose,
  onSaved,
}: AssignPoolHeadModalProps) {
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

  const [userType, setUserType] = useState<'Internal' | 'External'>('Internal');
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [poolId, setPoolId] = useState('');
  const [userId, setUserId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchApplied, setSearchApplied] = useState('');

  const assignMutation = useAssignPoolHeadMutation();

  /** GET /hrms/pools?all=true&departmentType=Internal */
  const poolsQuery = usePoolsListQuery(
    open
      ? userType === 'Internal'
        ? { all: true, departmentType: 'Internal' }
        : departmentId.trim()
          ? { all: true, departmentId: departmentId.trim() }
          : undefined
      : undefined,
    {
      enabled:
        open &&
        (userType === 'Internal' || Boolean(departmentId.trim())),
      scope: 'pool-heads-assign-pools',
    },
  );

  /** GET /hrms/departments?all=true&type=Internal */
  const internalDepartmentsQuery = useDepartmentsListQuery(
    open && userType === 'Internal'
      ? { all: true, type: 'Internal' }
      : undefined,
    {
      enabled: open && userType === 'Internal',
      scope: 'pool-heads-assign-int-dept',
    },
  );

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
  const externalDepartmentsQuery = useDepartmentsListQuery(
    open &&
      userType === 'External' &&
      resellerId.trim() &&
      parentCompanyId.trim()
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
      scope: 'pool-heads-assign-ext-dept',
    },
  );

  const membersParams = useMemo(
    () => ({
      all: true as const,
      ...(searchApplied.trim() ? { search: searchApplied.trim() } : {}),
    }),
    [searchApplied],
  );

  const membersQuery = usePoolMembersListQuery(
    poolId.trim() || undefined,
    membersParams,
    {
      enabled: open && Boolean(poolId.trim()),
      scope: 'pool-heads-assign-members',
    },
  );

  const membersLoading =
    membersQuery.isLoading || membersQuery.isFetching;
  const memberRows = useMemo(
    () => parseMemberRows(membersQuery.data),
    [membersQuery.data],
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
    const loading = externalDepartmentsQuery.isLoading;
    const base = pickItemsArray(externalDepartmentsQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    const prompt =
      !parentCompanyId.trim()
        ? 'Select parent company first'
        : loading
          ? 'Loading departments…'
          : '— Select department —';
    return [{ value: '', label: prompt }, ...base];
  }, [
    externalDepartmentsQuery.data,
    externalDepartmentsQuery.isLoading,
    parentCompanyId,
  ]);

  const poolOptions = useMemo(() => {
    const base = pickApiItems(poolsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        const name = pickStr(r, ['name', 'poolName']);
        if (!id || !name) return null;
        return { value: id, label: name };
      })
      .filter((x): x is { value: string; label: string } => x !== null);
    return [
      {
        value: '',
        label:
          userType === 'External' && !departmentId.trim()
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
    userType,
    departmentId,
  ]);

  const clearFilters = () => {
    setUserType(mayPickInternal ? 'Internal' : 'External');
    setResellerId('');
    setParentCompanyId('');
    setDepartmentId('');
    setPoolId('');
    setUserId('');
    setSearchInput('');
    setSearchApplied('');
  };

  useEffect(() => {
    if (!open) return;
    clearFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, mayPickInternal]);

  useEffect(() => {
    if (!open || mayPickInternal) return;
    setUserType('External');
  }, [open, mayPickInternal]);

  useEffect(() => {
    if (!userId.trim()) return;
    if (!memberRows.some((r) => r.id === userId)) setUserId('');
  }, [memberRows, userId]);

  // Internal departments query runs for network parity (same as web; not shown in Internal UI).
  void internalDepartmentsQuery.isFetched;

  const description = mayPickInternal
    ? 'Choose user type and pool. Internal pools are company-wide (not department-scoped). Only members of the selected pool are listed. For External, select reseller, parent company, and department first.'
    : 'External only: reseller, parent company, department, pool, then pick one member from that pool.';

  const handleClose = () => {
    if (assignMutation.isPending) return;
    clearFilters();
    onClose();
  };

  const handleSave = async () => {
    if (userType === 'External') {
      if (!resellerId.trim() || !parentCompanyId.trim()) {
        Alert.alert(
          'Validation',
          'Select reseller and parent company for external users.',
        );
        return;
      }
      if (!departmentId.trim()) {
        Alert.alert('Validation', 'Please select a department.');
        return;
      }
    }
    if (!poolId.trim()) {
      Alert.alert('Validation', 'Please select a pool.');
      return;
    }
    if (!userId.trim()) {
      Alert.alert('Validation', 'Please select a user (checkbox).');
      return;
    }
    try {
      await assignMutation.mutateAsync({
        poolId: poolId.trim(),
        userId: userId.trim(),
      });
      clearFilters();
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert(
        'Assign failed',
        extractApiErrorMessage(err, 'Could not assign pool head.'),
      );
    }
  };

  return (
    <FormModal
      open={open}
      title="Assign pool head"
      description={description}
      onClose={handleClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={assignMutation.isPending ? 'Assigning…' : 'Assign'}
      primaryButtonDisabled={
        assignMutation.isPending ||
        !poolId.trim() ||
        !userId.trim() ||
        (userType === 'External' &&
          (!resellerId.trim() ||
            !parentCompanyId.trim() ||
            !departmentId.trim()))
      }
      cancelButtonLabel="Close"
    >
      <View style={{ gap: 14 }}>
        <SelectField
          label="User type"
          value={userType}
          onChange={(v) => {
            const next = v === 'External' ? 'External' : 'Internal';
            setUserType(next);
            setDepartmentId('');
            setPoolId('');
            setUserId('');
            setSearchInput('');
            setSearchApplied('');
            if (next !== 'External') {
              setResellerId('');
              setParentCompanyId('');
            }
          }}
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
                setPoolId('');
                setUserId('');
                setSearchInput('');
                setSearchApplied('');
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
                setPoolId('');
                setUserId('');
                setSearchInput('');
                setSearchApplied('');
              }}
              options={parentCompanyOptions}
              disabled={assignMutation.isPending || !resellerId.trim()}
            />
            <SelectField
              label="Department"
              value={departmentId}
              onChange={(v) => {
                setDepartmentId(v);
                setPoolId('');
                setUserId('');
                setSearchInput('');
                setSearchApplied('');
              }}
              options={departmentOptions}
              disabled={assignMutation.isPending || !parentCompanyId.trim()}
            />
          </>
        ) : null}

        <SelectField
          label="Pool"
          value={poolId}
          onChange={(v) => {
            setPoolId(v);
            setUserId('');
            setSearchInput('');
            setSearchApplied('');
          }}
          options={poolOptions}
          disabled={
            assignMutation.isPending ||
            (userType === 'External' && !departmentId.trim())
          }
        />

        <View style={styles.membersHeader}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: `${theme.app.dashboard.accentPurple}33` },
            ]}
          >
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Typography variant="medium16" style={{ fontWeight: '700' }}>
              Pool members
            </Typography>
            <Typography variant="small" muted>
              {poolId.trim()
                ? 'Only members of the selected pool. The chosen user becomes pool head (removed from the member roster).'
                : 'Select a pool above to load members.'}
            </Typography>
          </View>
        </View>

        {poolId.trim() ? (
          <View style={styles.searchRow}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search name or email…"
              style={{ flex: 1 }}
              onSubmit={() => {
                setSearchApplied(searchInput.trim());
                setUserId('');
              }}
            />
            <Button
              variant="outlined"
              size="compact"
              disabled={membersLoading}
              onPress={() => {
                setSearchApplied(searchInput.trim());
                setUserId('');
              }}
            >
              Search
            </Button>
          </View>
        ) : null}

        <View
          style={[
            styles.membersBox,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          {!poolId.trim() ? (
            <Typography variant="small" muted>
              Select a pool to see members you can assign as pool head.
            </Typography>
          ) : membersLoading ? (
            <Typography variant="small" muted>
              Loading pool members…
            </Typography>
          ) : memberRows.length === 0 ? (
            <Typography variant="small" muted>
              {searchApplied.trim()
                ? 'No members match your search. Try another name or email.'
                : 'This pool has no members yet. Add members on the Pools page, then assign a pool head.'}
            </Typography>
          ) : (
            <View style={{ gap: 4 }}>
              <View style={styles.tableHeader}>
                <View style={styles.checkCol} />
                <Typography
                  variant="small"
                  muted
                  style={[styles.colMember, { fontWeight: '700' }]}
                >
                  Member
                </Typography>
                <Typography
                  variant="small"
                  muted
                  style={[styles.colDept, { fontWeight: '700' }]}
                >
                  Department
                </Typography>
              </View>
              {memberRows.map((row) => {
                const selected = userId === row.id;
                return (
                  <Pressable
                    key={row.id}
                    onPress={() =>
                      setUserId(selected ? '' : row.id)
                    }
                    style={({ pressed }) => [
                      styles.memberRow,
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
                    <View style={[styles.colMember, { gap: 2 }]}>
                      <Typography
                        variant="small"
                        style={{ fontWeight: '700' }}
                      >
                        {row.user}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        {row.email}
                      </Typography>
                    </View>
                    <Typography
                      variant="small"
                      muted
                      style={styles.colDept}
                      numberOfLines={2}
                    >
                      {row.department}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.clearRow}>
          <Button
            variant="outlined"
            size="compact"
            disabled={assignMutation.isPending}
            onPress={clearFilters}
          >
            Clear filters
          </Button>
        </View>
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  membersBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 88,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 6,
    paddingBottom: 8,
  },
  memberRow: {
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
  colMember: {
    flex: 1.4,
    minWidth: 0,
  },
  colDept: {
    flex: 1,
    minWidth: 0,
  },
  clearRow: {
    alignItems: 'flex-end',
  },
});
