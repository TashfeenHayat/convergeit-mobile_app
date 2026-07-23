import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Calendar,
  FormModal,
  SearchBar,
  SelectField,
  Typography,
  UserTypeBadge,
} from '@/components/ui';
import { WorkingWeekDayToggles } from '@/features/hrms/components/WorkingWeekDayToggles';
import { useAppTheme } from '@/theme';

export type UserShiftAssignUser = {
  id: string;
  name: string;
  email: string;
  type: 'Internal' | 'External';
  resellerName: string;
  parentCompanyName: string;
};

export type UserShiftAssignModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  users: UserShiftAssignUser[];
  usersLoading?: boolean;
  userId: string;
  onUserIdChange: (id: string) => void;
  shiftId: string;
  onShiftIdChange: (id: string) => void;
  shiftOptions: { value: string; label: string }[];
  effectiveFrom: string;
  onEffectiveFromChange: (v: string) => void;
  effectiveTo: string;
  onEffectiveToChange: (v: string) => void;
  overrideWeek: boolean;
  onOverrideWeekChange: (v: boolean) => void;
  workingMask: number;
  onWorkingMaskChange: (mask: number) => void;
};

type TypeFilter = 'all' | 'Internal' | 'External';

/**
 * Add user shift dialog — matches web User Shift Roster modal.
 */
export function UserShiftAssignModal({
  open,
  onClose,
  onSave,
  isSaving,
  users,
  usersLoading = false,
  userId,
  onUserIdChange,
  shiftId,
  onShiftIdChange,
  shiftOptions,
  effectiveFrom,
  onEffectiveFromChange,
  effectiveTo,
  onEffectiveToChange,
  overrideWeek,
  onOverrideWeekChange,
  workingMask,
  onWorkingMaskChange,
}: UserShiftAssignModalProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearchInput('');
    setTypeFilter('all');
  }, [open]);

  const searchNorm = searchInput.trim().toLowerCase();

  const tableRows = useMemo(() => {
    let list = users;
    if (typeFilter !== 'all') {
      list = list.filter((u) => u.type === typeFilter);
    }
    if (searchNorm) {
      list = list.filter((u) => {
        const hay = [
          u.name,
          u.email,
          u.type,
          u.resellerName,
          u.parentCompanyName,
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(searchNorm);
      });
    }
    const uid = userId.trim();
    if (uid) {
      const selected = users.find((u) => u.id === uid);
      const alreadyIn = list.some((u) => u.id === uid);
      const keepSelected =
        selected && (typeFilter === 'all' || selected.type === typeFilter);
      if (selected && !alreadyIn && keepSelected) {
        return [selected, ...list];
      }
    }
    return list;
  }, [users, typeFilter, searchNorm, userId]);

  const selectedUser = useMemo(
    () => users.find((u) => u.id === userId.trim()) ?? null,
    [users, userId],
  );

  const typeChips: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'Internal', label: 'Internal' },
    { value: 'External', label: 'External' },
  ];

  return (
    <FormModal
      open={open}
      title="Add user shift"
      description="Choose a user, then shift and dates — all steps stay in this dialog."
      onClose={onClose}
      onSave={onSave}
      primaryButtonLabel={isSaving ? 'Saving…' : 'Assign'}
      primaryButtonDisabled={isSaving}
      cancelButtonLabel="Close"
    >
      <View style={{ gap: 14 }}>
        {/* Users panel */}
        <View
          style={[
            styles.panel,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={styles.panelHead}>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              Users
            </Typography>
            <Typography variant="small" muted>
              Type filter matches the list when you open this dialog. Pick All
              to see everyone in scope.
            </Typography>
          </View>

          <View
            style={[
              styles.toolbar,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <View style={styles.typeRow}>
              <Typography
                variant="small"
                muted
                style={{ fontWeight: '800', letterSpacing: 0.6 }}
              >
                Type
              </Typography>
              <View style={styles.chips}>
                {typeChips.map((chip) => {
                  const active = typeFilter === chip.value;
                  return (
                    <Pressable
                      key={chip.value}
                      onPress={() => setTypeFilter(chip.value)}
                      style={[
                        styles.chip,
                        {
                          borderColor: active
                            ? accent
                            : theme.app.dashboard.cardBorder,
                          backgroundColor: active ? accent : 'transparent',
                        },
                      ]}
                    >
                      <Typography
                        variant="small"
                        color={active ? '#FFFFFF' : theme.app.text.secondary}
                        style={{ fontWeight: '700' }}
                      >
                        {chip.label}
                      </Typography>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search name, email, reseller, parent…"
 />
          </View>

          <ScrollView
            style={styles.userList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {usersLoading ? (
              <Typography variant="small" muted style={styles.listPad}>
                Loading users…
              </Typography>
            ) : tableRows.length === 0 ? (
              <View style={styles.listPad}>
                <Typography variant="medium" style={{ fontWeight: '700' }}>
                  No users to show
                </Typography>
                <Typography variant="small" muted>
                  {users.length === 0
                    ? 'Load users from the page first, or adjust filters in this panel.'
                    : 'No users match the current filters in this panel.'}
                </Typography>
              </View>
            ) : (
              tableRows.map((u) => {
                const selected = u.id === userId.trim();
                return (
                  <Pressable
                    key={u.id}
                    onPress={() => onUserIdChange(u.id)}
                    style={({ pressed }) => [
                      styles.userRow,
                      {
                        borderColor: selected
                          ? accent
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: selected
                          ? `${accent}22`
                          : 'transparent',
                        opacity: pressed ? 0.92 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                      <Typography
                        variant="medium"
                        style={{ fontWeight: '700' }}
                        numberOfLines={1}
                      >
                        {u.name}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        {u.email}
                      </Typography>
                      <Typography variant="small" muted numberOfLines={1}>
                        Reseller:{' '}
                        {u.type === 'Internal' ? '—' : u.resellerName} · Parent:{' '}
                        {u.type === 'Internal' ? '—' : u.parentCompanyName}
                      </Typography>
                    </View>
                    <UserTypeBadge value={u.type} />
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          <View
            style={[
              styles.summary,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Typography variant="small" muted>
              {usersLoading
                ? 'Loading…'
                : `${tableRows.length} shown · ${users.length} in scope`}
            </Typography>
            {userId.trim() && selectedUser ? (
              <Typography
                variant="small"
                style={{ fontWeight: '600' }}
                numberOfLines={1}
              >
                Selected: {selectedUser.name} ({selectedUser.type})
              </Typography>
            ) : (
              <Typography variant="small" muted>
                No user selected
              </Typography>
            )}
          </View>
        </View>

        {/* Shift & schedule panel */}
        <View
          style={[
            styles.panel,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View style={styles.panelHead}>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              Shift & schedule
            </Typography>
            <Typography variant="small" muted>
              Template and effective range for this assignment.
            </Typography>
          </View>

          <View style={styles.scheduleBody}>
            <SelectField
              label="Shift"
              value={shiftId}
              onChange={onShiftIdChange}
              options={shiftOptions}
 />
            <Calendar
              label="Effective from"
              value={effectiveFrom}
              onChange={onEffectiveFromChange}
              max={effectiveTo || undefined}
 />
            <Calendar
              label="Effective to"
              value={effectiveTo}
              onChange={onEffectiveToChange}
              min={effectiveFrom || undefined}
 />
          </View>

          <View
            style={[
              styles.overrideBlock,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Typography
              variant="small"
              muted
              style={{
                fontWeight: '800',
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              Weekly pattern override
            </Typography>
            <Pressable
              onPress={() => onOverrideWeekChange(!overrideWeek)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: overrideWeek }}
              style={styles.overrideRow}
              disabled={isSaving}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: accent,
                    backgroundColor: overrideWeek ? accent : 'transparent',
                  },
                ]}
              >
                {overrideWeek ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Typography variant="medium" style={{ fontWeight: '600' }}>
                  Use custom working days
                </Typography>
                <Typography variant="small" muted>
                  Leave off to inherit the shift template. Turn on to send an
                  explicit mask with this assignment.
                </Typography>
              </View>
            </Pressable>
            {overrideWeek ? (
              <View style={{ marginTop: 10 }}>
                <WorkingWeekDayToggles
                  value={workingMask}
                  onChange={onWorkingMaskChange}
                  disabled={isSaving}
 />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  panelHead: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 4,
  },
  toolbar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  userList: {
    maxHeight: 280,
  },
  listPad: {
    padding: 16,
    gap: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  scheduleBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  overrideBlock: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  overrideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
