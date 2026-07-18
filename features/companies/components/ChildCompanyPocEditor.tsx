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
import { useRolesListQuery } from '@/lib/hooks/query/roles';
import { useUsersListQuery } from '@/lib/hooks/query/users';
import { glassUi } from '@/lib/theme/glass-ui';
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

export function ChildCompanyPocEditor({
  child,
  parentCompanyId,
  pocs,
  onPocsChange,
  disabled = false,
}: {
  child: ParentCompanyChildDetail;
  parentCompanyId: string;
  pocs: ChildPocEditRow[];
  onPocsChange: (next: ChildPocEditRow[]) => void;
  disabled?: boolean;
}) {
  const theme = useAppTheme();
  const [mode, setMode] = useState<'existing' | 'invite'>('invite');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [inviteRow, setInviteRow] = useState<PocDraftSlice>(() => {
    const slice = emptyPocSlice();
    slice.pocDepartmentMode = 'new';
    slice.pocDepartmentName = 'General';
    slice.pocDesignationMode = 'new';
    slice.pocDesignationTitle = 'Admin';
    return slice;
  });

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

  const rolesQuery = useRolesListQuery({ page: 1, limit: 100 }, { enabled: showAddForm });
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

  useEffect(() => {
    if (!inviteRow.roleId && roleOptions[0]?.value) {
      setInviteRow((p) => ({ ...p, roleId: roleOptions[0].value }));
    }
  }, [inviteRow.roleId, roleOptions]);

  const usersQuery = useUsersListQuery(
    { parentCompanyId: parentCompanyId.trim(), all: true },
    { enabled: showAddForm && mode === 'existing' && parentCompanyId.trim().length > 0 },
  );
  const userOptions = useMemo(() => {
    const rows = extractUsersRows(usersQuery.data);
    return rows.map((u) => ({
      value: u.id,
      label: `${u.user} · ${u.email}`,
    }));
  }, [usersQuery.data]);

  const resetInviteForm = () => {
    const slice = emptyPocSlice();
    slice.pocDepartmentMode = 'new';
    slice.pocDepartmentName = 'General';
    slice.pocDesignationMode = 'new';
    slice.pocDesignationTitle = 'Admin';
    slice.roleId = roleOptions[0]?.value ?? '';
    setInviteRow(slice);
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

  return (
    <View style={styles.wrap}>
      <Typography variant="medium" style={{ fontWeight: '700' }}>
        Points of contact (POC)
      </Typography>
      <Typography variant="small" muted>
        Up to {MAX_POC_PER_CHILD} contacts. Saved POCs stay linked; add new ones below.
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
            <Typography variant="small" muted>
              Saved
            </Typography>
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
          Add POC
        </Button>
      ) : null}

      {!canAddMore && !disabled ? (
        <Typography variant="small" muted>
          Maximum of {MAX_POC_PER_CHILD} POCs reached.
        </Typography>
      ) : null}

      {showAddForm && canAddMore ? (
        <View style={styles.addForm}>
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
                <Button size="compact" variant="outlined" onPress={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  size="compact"
                  onPress={queueExistingUser}
                  disabled={!selectedUserId.trim()}
                >
                  Queue user
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
                label="Last name"
                value={inviteRow.pocLastName}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocLastName: v }))}
                placeholder="Last name"
              />
              <InputField
                label="Email"
                value={inviteRow.pocEmail}
                onChangeText={(v) => setInviteRow((p) => ({ ...p, pocEmail: v }))}
                placeholder="poc@company.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <SelectField
                label="Role"
                value={inviteRow.roleId}
                onChange={(v) => setInviteRow((p) => ({ ...p, roleId: v }))}
                options={
                  roleOptions.length
                    ? roleOptions
                    : [{ value: '', label: rolesQuery.isLoading ? 'Loading roles…' : 'No roles' }]
                }
              />
              <Typography variant="small" muted>
                Department defaults to General · designation Admin (same as setup).
              </Typography>
              <View style={styles.addActions}>
                <Button size="compact" variant="outlined" onPress={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button
                  size="compact"
                  onPress={queueInvitePoc}
                  disabled={!isPocSliceComplete(inviteRow)}
                >
                  Queue invite
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
  addForm: { gap: 10 },
  addActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
