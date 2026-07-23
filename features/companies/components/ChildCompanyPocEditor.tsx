import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ParentCompanyChildDetail } from '@/api/types/companies.types';
import {
  Button,
  InputField,
  SegmentedControl,
  SelectField,
  Typography,
} from '@/components/ui';
import { normalizePocsFromCarrier } from '@/lib/companies/parent-detail-pocs';
import {
  buildPocInviteForSlice,
  emptyPocSlice,
  isPocSliceComplete,
  MAX_POC_PER_CHILD,
  type PocDraftSlice,
} from '@/lib/companies/setup-draft.utils';
import { isSelectableDepartmentId } from '@/lib/hrms/department-ids';
import { useDepartmentsListQuery, useDesignationsListQuery } from '@/lib/hooks/query/hrms';
import { useRolesListQuery } from '@/lib/hooks/query/roles';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { glassUi } from '@/lib/theme/glass-ui';
import {
  findDefaultStandardExternalRoleId,
  isExternalAdminScope,
  resolveRoleIdForExternalAdminScope,
  type ExternalAdminScope,
} from '@/lib/users/user-admin-scope';
import { extractUsersRows } from '@/lib/users/user-list-rows';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

export type ChildPocEditRow = {
  companyContactId?: string;
  userId?: string;
  pocInvite?: Record<string, unknown>;
  /** Local UI label for queued rows before save. */
  pendingLabel?: string;
};

export function savedPocRowsFromChild(child: ParentCompanyChildDetail): ChildPocEditRow[] {
  return normalizePocsFromCarrier(child)
    .map((r) => ({
      ...(r.companyContactId ? { companyContactId: r.companyContactId } : {}),
      ...(r.userId ? { userId: r.userId } : {}),
    }))
    .filter((r) => Boolean(r.companyContactId || r.userId));
}

const ACCESS_OPTIONS: {
  value: ExternalAdminScope;
  title: string;
  subtitle: string;
}[] = [
  { value: 'standard', title: 'Standard user', subtitle: 'You pick the role' },
  { value: 'parent_company', title: 'Parent Company Admin', subtitle: 'One parent company' },
  { value: 'wide_reseller', title: 'Reseller Admin', subtitle: 'All client companies' },
];

export function ChildCompanyPocEditor({
  child,
  parentCompanyId,
  resellerId,
  pocs,
  onPocsChange,
  disabled = false,
  /** Prefetch users/roles/departments while step 2 is open (matches web edit?step=2). */
  prefetchLookups = false,
}: {
  child: ParentCompanyChildDetail;
  parentCompanyId: string;
  resellerId?: string;
  pocs: ChildPocEditRow[];
  onPocsChange: (next: ChildPocEditRow[]) => void;
  disabled?: boolean;
  prefetchLookups?: boolean;
}) {
  const theme = useAppTheme();
  const [mode, setMode] = useState<'existing' | 'invite'>('invite');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [accessScope, setAccessScope] = useState<ExternalAdminScope>('standard');
  const [inviteRow, setInviteRow] = useState<PocDraftSlice>(() => emptyPocSlice());

  const displayRows = useMemo(() => normalizePocsFromCarrier(child), [child]);
  const savedRows = useMemo(() => savedPocRowsFromChild(child), [child]);

  const pendingAdds = useMemo(() => {
    const savedKeys = new Set(
      savedRows.map((r) => r.companyContactId ?? r.userId ?? '').filter(Boolean),
    );
    return pocs.filter((p) => {
      const key = p.companyContactId ?? p.userId ?? '';
      return key ? !savedKeys.has(key) : Boolean(p.pocInvite);
    });
  }, [pocs, savedRows]);

  const totalSlots = savedRows.length + pendingAdds.length;
  const canAddMore = totalSlots < MAX_POC_PER_CHILD && !disabled;

  const parentIdTrimmed = parentCompanyId.trim();
  const resellerTrimmed = resellerId?.trim() ?? '';
  const lookupsEnabled = prefetchLookups || showAddForm;
  const usersEnabled =
    parentIdTrimmed.length > 0 && (prefetchLookups || (showAddForm && mode === 'existing'));
  const inviteFormOpen = showAddForm && mode === 'invite';

  const rolesQuery = useRolesListQuery(undefined, { enabled: lookupsEnabled });
  const roleOptions = useMemo(
    () =>
      pickApiItems(rolesQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id ? { label: pickStr(r, ['name']) || id, value: id } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [rolesQuery.data],
  );

  const standardRoleOptions = useMemo(
    () =>
      roleOptions.filter(
        (r) =>
          r.label.trim() !== 'Parent Company Admin' &&
          r.label.trim() !== 'Reseller Admin' &&
          r.label.trim() !== 'Platform Admin' &&
          r.label.trim() !== 'SuperAdmin',
      ),
    [roleOptions],
  );

  const usersQuery = useUsersListQuery(
    { parentCompanyId: parentIdTrimmed, all: true },
    { enabled: usersEnabled },
  );

  const deptsQuery = useDepartmentsListQuery(
    {
      all: true,
      type: 'External',
      ...(resellerTrimmed ? { resellerId: resellerTrimmed } : {}),
      parentCompanyId: parentIdTrimmed,
    },
    {
      enabled: lookupsEnabled && parentIdTrimmed.length > 0 && Boolean(resellerTrimmed),
      scope: 'child-poc-editor',
    },
  );

  const deptOptions = useMemo(
    () =>
      pickApiItems(deptsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id && isSelectableDepartmentId(id)
            ? { label: pickStr(r, ['name']) || id, value: id }
            : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [deptsQuery.data],
  );

  const designationParams = useMemo(() => {
    if (isSelectableDepartmentId(inviteRow.pocDepartmentId)) {
      return { departmentId: inviteRow.pocDepartmentId, all: true };
    }
    return { all: true };
  }, [inviteRow.pocDepartmentId]);

  const designationsQuery = useDesignationsListQuery(designationParams, {
    enabled: inviteFormOpen && inviteRow.pocDesignationMode === 'existing',
    scope: 'child-poc-editor',
  });

  const designationOptions = useMemo(
    () =>
      pickApiItems(designationsQuery.data)
        .filter(isRecord)
        .map((r) => {
          const id = pickStr(r, ['id']);
          return id ? { label: pickStr(r, ['title', 'name']) || id, value: id } : null;
        })
        .filter((x): x is { label: string; value: string } => x !== null),
    [designationsQuery.data],
  );

  const userOptions = useMemo(() => {
    const rows = extractUsersRows(usersQuery.data);
    return rows.map((u) => ({
      value: u.id,
      label: `${u.user} · ${u.email}`,
    }));
  }, [usersQuery.data]);

  useEffect(() => {
    if (!inviteFormOpen || roleOptions.length === 0) return;
    if (isExternalAdminScope(accessScope)) {
      const id = resolveRoleIdForExternalAdminScope(accessScope, roleOptions);
      if (id && inviteRow.roleId !== id) {
        setInviteRow((p) => ({
          ...p,
          roleId: id,
          pocWideResellerScope: accessScope === 'wide_reseller',
        }));
      }
      return;
    }
    if (!inviteRow.roleId) {
      const id = findDefaultStandardExternalRoleId(standardRoleOptions.length ? standardRoleOptions : roleOptions);
      if (id) {
        setInviteRow((p) => ({ ...p, roleId: id, pocWideResellerScope: false }));
      }
    }
  }, [
    inviteFormOpen,
    accessScope,
    roleOptions,
    standardRoleOptions,
    inviteRow.roleId,
  ]);

  const resetInviteForm = () => {
    setAccessScope('standard');
    setInviteRow(emptyPocSlice());
    setSelectedUserId('');
    setMode('invite');
  };

  const applyAccessScope = (scope: ExternalAdminScope) => {
    setAccessScope(scope);
    if (isExternalAdminScope(scope)) {
      const id = resolveRoleIdForExternalAdminScope(scope, roleOptions);
      setInviteRow((p) => ({
        ...p,
        roleId: id ?? '',
        pocWideResellerScope: scope === 'wide_reseller',
      }));
      return;
    }
    const id = findDefaultStandardExternalRoleId(
      standardRoleOptions.length ? standardRoleOptions : roleOptions,
    );
    setInviteRow((p) => ({
      ...p,
      roleId: id ?? '',
      pocWideResellerScope: false,
    }));
  };

  const queueExistingUser = () => {
    const uid = selectedUserId.trim();
    if (!uid || !canAddMore) return;
    const already = pocs.some((p) => p.userId === uid);
    if (already) return;
    const label = userOptions.find((o) => o.value === uid)?.label ?? uid;
    onPocsChange([...savedRows, ...pendingAdds, { userId: uid, pendingLabel: label }]);
    setSelectedUserId('');
    setShowAddForm(false);
  };

  const queueInvitePoc = () => {
    if (!isPocSliceComplete(inviteRow) || !canAddMore) return;
    const invite = buildPocInviteForSlice(inviteRow);
    if (!invite) return;
    const label = `${inviteRow.pocFirstName.trim()} ${inviteRow.pocLastName.trim()} · ${inviteRow.pocEmail.trim()}`;
    onPocsChange([
      ...savedRows,
      ...pendingAdds,
      { pocInvite: invite as Record<string, unknown>, pendingLabel: label },
    ]);
    resetInviteForm();
    setShowAddForm(false);
  };

  const removePending = (indexInPending: number) => {
    const nextPending = pendingAdds.filter((_, i) => i !== indexInPending);
    onPocsChange([...savedRows, ...nextPending]);
  };

  const accentGreen = '#22c55e';

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="person-outline" size={16} color={theme.app.dashboard.accentBlue} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Point of contact (POC)
          </Typography>
          <Typography variant="small" muted>
            External users for this branch — up to {MAX_POC_PER_CHILD} contacts.
          </Typography>
        </View>
      </View>

      <Typography variant="small" muted>
        Up to {MAX_POC_PER_CHILD} important contacts per child. Saved POCs cannot be deleted here;
        names are fixed after creation. Department is optional; designation is required for new
        invites.
      </Typography>

      <Typography variant="small" muted style={{ fontWeight: '700' }}>
        Saved POCs (read-only)
      </Typography>

      {displayRows.length === 0 ? (
        <Typography variant="small" muted>
          No POC linked yet.
        </Typography>
      ) : (
        displayRows.map((row) => (
          <View
            key={row.key}
            style={[
              styles.pocRow,
              {
                backgroundColor: theme.app.dashboard.overlayLight,
                borderColor: theme.app.dashboard.cardBorder,
              },
            ]}
          >
            <View style={styles.pocIcon}>
              <Ionicons name="person-outline" size={16} color={theme.app.dashboard.accentBlue} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Typography variant="medium" style={{ fontWeight: '600' }} numberOfLines={1}>
                {row.name}
              </Typography>
              <Typography variant="small" muted numberOfLines={1}>
                {row.email}
              </Typography>
            </View>
          </View>
        ))
      )}

      {pendingAdds.map((row, idx) => (
        <View
          key={`pending-${idx}-${row.userId ?? 'invite'}`}
          style={[
            styles.pocRow,
            {
              backgroundColor: 'rgba(88, 101, 242, 0.12)',
              borderColor: theme.app.dashboard.cardBorder,
            },
          ]}
        >
          <View style={styles.pocIcon}>
            <Ionicons name="person-add-outline" size={16} color={theme.app.dashboard.accentBlue} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="medium" style={{ fontWeight: '600' }} numberOfLines={1}>
              {row.pendingLabel ?? (row.userId ? `User ${row.userId}` : 'New invite')}
            </Typography>
            <Typography variant="small" muted>
              Queued — save to apply
            </Typography>
          </View>
          {!disabled ? (
            <Pressable onPress={() => removePending(idx)} hitSlop={8}>
              <Ionicons name="close-circle-outline" size={20} color={theme.app.text.muted} />
            </Pressable>
          ) : null}
        </View>
      ))}

      {canAddMore && !showAddForm ? (
        <Button
          size="compact"
          variant="outlined"
          onPress={() => {
            resetInviteForm();
            setShowAddForm(true);
          }}
        >
          + Add POC
        </Button>
      ) : null}

      {!canAddMore && !disabled ? (
        <Typography variant="small" muted>
          Maximum of {MAX_POC_PER_CHILD} POCs reached.
        </Typography>
      ) : null}

      {showAddForm && canAddMore ? (
        <View
          style={[
            styles.addForm,
            {
              backgroundColor: theme.app.dashboard.overlayLight,
              borderColor: theme.app.dashboard.cardBorder,
            },
          ]}
        >
          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v as 'existing' | 'invite')}
            options={[
              { value: 'invite', label: 'New invite' },
              { value: 'existing', label: 'Existing user' },
            ]}
          />

          {mode === 'existing' ? (
            <>
              <SelectField
                label="User"
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={
                  userOptions.length
                    ? userOptions
                    : [
                        {
                          value: '',
                          label: usersQuery.isLoading ? 'Loading users…' : 'No users found',
                        },
                      ]
                }
              />
              <View style={styles.addActions}>
                <Button
                  size="compact"
                  onPress={queueExistingUser}
                  disabled={!selectedUserId.trim()}
                >
                  Add to save payload
                </Button>
                <Button size="compact" variant="outlined" onPress={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <>
              <InputField
                label="First name"
                value={inviteRow.pocFirstName}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocFirstName: v }))}
                placeholder="First name"
              />
              <InputField
                label="Middle name (optional)"
                value={inviteRow.pocMiddleName}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocMiddleName: v }))}
                placeholder="Middle name"
              />
              <InputField
                label="Last name"
                value={inviteRow.pocLastName}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocLastName: v }))}
                placeholder="Last name"
              />
              <InputField
                label="POC email"
                value={inviteRow.pocEmail}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocEmail: v }))}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="off"
                textContentType="none"
                importantForAutofill="no"
              />
              <InputField
                label="Initial password (optional)"
                value={inviteRow.pocPassword}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocPassword: v }))}
                placeholder="Leave blank for default Admin@123"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                importantForAutofill="no"
                helperText="Min 8 chars with upper, lower, number, and special character. Blank uses Admin@123."
              />

              <Typography variant="small" muted style={{ fontWeight: '700' }}>
                Access level
              </Typography>
              <View style={styles.accessRow}>
                {ACCESS_OPTIONS.map((opt) => {
                  const selected = accessScope === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => applyAccessScope(opt.value)}
                      style={[
                        styles.accessCard,
                        {
                          borderColor: selected ? accentGreen : theme.app.dashboard.cardBorder,
                          backgroundColor: selected
                            ? 'rgba(34, 197, 94, 0.12)'
                            : theme.app.dashboard.overlayLight,
                        },
                      ]}
                    >
                      <View style={styles.accessCardTop}>
                        <View
                          style={[
                            styles.radioOuter,
                            { borderColor: selected ? accentGreen : theme.app.text.muted },
                          ]}
                        >
                          {selected ? (
                            <View style={[styles.radioInner, { backgroundColor: accentGreen }]} />
                          ) : null}
                        </View>
                        <Typography
                          variant="small"
                          style={{ fontWeight: '700', flex: 1 }}
                          numberOfLines={2}
                        >
                          {opt.title}
                        </Typography>
                      </View>
                      <Typography variant="small" muted numberOfLines={2}>
                        {opt.subtitle}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>

              {accessScope === 'standard' ? (
                <SelectField
                  label="Role"
                  value={inviteRow.roleId}
                  onChange={(v) => setInviteRow((p) => ({ ...p, roleId: v }))}
                  options={
                    standardRoleOptions.length
                      ? standardRoleOptions
                      : roleOptions.length
                        ? roleOptions
                        : [
                            {
                              value: '',
                              label: rolesQuery.isLoading ? 'Loading roles…' : 'No roles',
                            },
                          ]
                  }
                />
              ) : (
                <SelectField
                  label="Role"
                  value={inviteRow.roleId}
                  onChange={() => {}}
                  disabled
                  options={
                    roleOptions.length
                      ? roleOptions
                      : [
                          {
                            value: '',
                            label: rolesQuery.isLoading ? 'Loading roles…' : 'No roles',
                          },
                        ]
                  }
                />
              )}

              <Typography variant="small" muted style={{ fontWeight: '700' }}>
                Department
              </Typography>
              <SegmentedControl
                value={inviteRow.pocDepartmentMode}
                onChange={(v) =>
                  setInviteRow((p) => ({
                    ...p,
                    pocDepartmentMode: v as 'existing' | 'new',
                    pocDepartmentId: '',
                    pocDepartmentName: '',
                    pocDesignationId: '',
                    pocDesignationTitle: '',
                  }))
                }
                options={[
                  { value: 'existing', label: 'Pick from list' },
                  { value: 'new', label: 'New department' },
                ]}
              />
              {inviteRow.pocDepartmentMode === 'existing' ? (
                <SelectField
                  label="Department"
                  value={inviteRow.pocDepartmentId}
                  onChange={(v) => {
                    const opt = deptOptions.find((o) => o.value === v);
                    setInviteRow((p) => ({
                      ...p,
                      pocDepartmentId: v,
                      pocDepartmentName: opt?.label ?? '',
                      pocDesignationId: '',
                      pocDesignationTitle: '',
                    }));
                  }}
                  options={
                    deptOptions.length
                      ? [{ value: '', label: '— Select department —' }, ...deptOptions]
                      : [
                          {
                            value: '',
                            label: deptsQuery.isLoading ? 'Loading…' : 'No departments',
                          },
                        ]
                  }
                />
              ) : (
                <InputField
                  label="New department name"
                  value={inviteRow.pocDepartmentName}
                  onChangeText={(v) => setInviteRow((p) => ({ ...p, pocDepartmentName: v }))}
                  placeholder="e.g. Support"
                />
              )}

              <Typography variant="small" muted style={{ fontWeight: '700' }}>
                Designation
              </Typography>
              <SegmentedControl
                value={inviteRow.pocDesignationMode}
                onChange={(v) =>
                  setInviteRow((p) => ({
                    ...p,
                    pocDesignationMode: v as 'existing' | 'new',
                    pocDesignationId: '',
                    pocDesignationTitle: '',
                  }))
                }
                options={[
                  { value: 'existing', label: 'Pick from list' },
                  { value: 'new', label: 'New designation' },
                ]}
              />
              {inviteRow.pocDesignationMode === 'existing' ? (
                <SelectField
                  label="Designation"
                  value={inviteRow.pocDesignationId}
                  onChange={(v) => {
                    const opt = designationOptions.find((o) => o.value === v);
                    setInviteRow((p) => ({
                      ...p,
                      pocDesignationId: v,
                      pocDesignationTitle: opt?.label ?? '',
                    }));
                  }}
                  options={
                    designationOptions.length
                      ? [{ value: '', label: '— Select designation —' }, ...designationOptions]
                      : [
                          {
                            value: '',
                            label: designationsQuery.isLoading
                              ? 'Loading…'
                              : '— Select designation —',
                          },
                        ]
                  }
                />
              ) : (
                <InputField
                  label="New designation title"
                  value={inviteRow.pocDesignationTitle}
                  onChangeText={(v) => setInviteRow((p) => ({ ...p, pocDesignationTitle: v }))}
                  placeholder="e.g. Admin"
                />
              )}

              <View style={styles.addActions}>
                <Button
                  size="compact"
                  onPress={queueInvitePoc}
                  disabled={!isPocSliceComplete(inviteRow)}
                >
                  Add to save payload
                </Button>
                <Button size="compact" variant="outlined" onPress={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </View>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 4 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
    marginTop: 2,
  },
  pocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  pocIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(88, 101, 242, 0.16)',
    borderWidth: 1,
    borderColor: glassUi.border.subtle,
  },
  addForm: {
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  addActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  accessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessCard: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    gap: 6,
  },
  accessCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
