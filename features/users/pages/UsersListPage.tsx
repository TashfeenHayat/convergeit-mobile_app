import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  ListTableCard,
  SearchBar,
  StatusChip,
  TablePagination,
  Typography,
} from '@/components/ui';
import { AddUserModal } from '@/features/users/components/AddUserModal';
import { UsersStatsCards } from '@/features/users/components/UsersStatsCards';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  useSoftDeleteUserMutation,
  useUsersListQuery,
} from '@/lib/hooks/query/users';
import { OP } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 15;

type UserRow = {
  id: string;
  name: string;
  email: string;
  userType: string;
  firstName: string;
  lastName: string;
  roleId: string;
  departmentId: string;
  roleName: string;
};

function parseRows(data: unknown): UserRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const firstName = pickStr(r, ['firstName', 'first_name']);
      const lastName = pickStr(r, ['lastName', 'last_name']);
      const role = isRecord(r.role) ? r.role : null;
      const dept = isRecord(r.department) ? r.department : null;
      const userTypeRaw = pickStr(r, ['userType', 'type']) || 'Internal';
      return {
        id,
        firstName,
        lastName,
        name: [firstName, lastName].filter(Boolean).join(' ') || pickStr(r, ['email']) || '—',
        email: pickStr(r, ['email']) || '—',
        userType: userTypeRaw,
        roleId: pickStr(r, ['roleId']) || pickStr(role, ['id']),
        departmentId: pickStr(r, ['departmentId']) || pickStr(dept, ['id']),
        roleName: pickStr(role, ['name']) || pickStr(r, ['roleName']) || '',
      };
    })
    .filter((x): x is UserRow => x !== null);
}

function isInternalType(userType: string): boolean {
  return userType.trim().toLowerCase() === 'internal';
}

export function UsersListPage() {
  const theme = useAppTheme();
  const { hasOperational, isPlatformAdmin, user: authUser } = useAuth();
  const canCreate = hasOperational(OP.user.create);
  const canUpdate = hasOperational(OP.user.update);
  const canDelete = hasOperational(OP.user.delete);
  const showInternal = sessionMayPickInternalUserScope(
    isPlatformAdmin,
    authUser as SessionScopeUser | null,
  );

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<'all' | 'Internal' | 'External'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const query = useUsersListQuery({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    userType: typeFilter === 'all' ? undefined : typeFilter,
  });
  const deleteMutation = useSoftDeleteUserMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const internalCount = rows.filter((r) => isInternalType(r.userType)).length;
    const externalCount = rows.filter((r) => !isInternalType(r.userType)).length;
    return {
      totalUsers: total,
      internalCount,
      externalCount,
    };
  }, [rows, total]);

  const openCreate = () => {
    setEditUserId(null);
    setModalOpen(true);
  };

  const openEdit = (row: UserRow) => {
    setEditUserId(row.id);
    setModalOpen(true);
  };

  const filterOptions = useMemo(() => {
    const opts: { value: 'all' | 'Internal' | 'External'; label: string }[] = [
      { value: 'all', label: 'All' },
      { value: 'External', label: 'External' },
    ];
    if (showInternal) opts.splice(1, 0, { value: 'Internal', label: 'Internal' });
    return opts;
  }, [showInternal]);

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <DashboardPageIntro subtitle="Directory of platform and client users.">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search users…"
          />

          <View style={styles.filterRow}>
            {filterOptions.map((opt) => {
              const selected = typeFilter === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setTypeFilter(opt.value);
                    setPage(1);
                  }}
                  style={({ pressed }) => [
                    styles.filterChip,
                    {
                      borderColor: selected
                        ? `${theme.app.dashboard.accentBlue}99`
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: selected
                        ? `${theme.app.dashboard.accentBlue}22`
                        : theme.app.dashboard.overlayLight,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    style={{ fontWeight: selected ? '700' : '500' }}
                    color={selected ? theme.app.dashboard.accentBlue : theme.app.text.secondary}
                  >
                    {opt.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          {canCreate ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add user"
              style={({ pressed }) => [
                styles.addCta,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: theme.app.dashboard.overlayLight,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              <View
                style={[
                  styles.addCtaGlow,
                  { backgroundColor: `${theme.app.dashboard.accentBlue}18` },
                ]}
              />
              <View
                style={[
                  styles.addCtaIcon,
                  {
                    backgroundColor: theme.app.dashboard.accentBlue,
                    borderColor: `${theme.app.dashboard.accentBlue}66`,
                  },
                ]}
              >
                <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Add user
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Invite internal or external access
                </Typography>
              </View>
              <View
                style={[
                  styles.addCtaChevron,
                  {
                    backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                    borderColor: glassUi.border.subtle,
                  },
                ]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={theme.app.dashboard.accentBlue}
                />
              </View>
            </Pressable>
          ) : null}
        </DashboardPageIntro>

        <UsersStatsCards
          totalUsers={stats.totalUsers}
          internalCount={stats.internalCount}
          externalCount={stats.externalCount}
          showInternal={showInternal}
        />

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load users.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="User directory"
            subtitle={`${total} result${total === 1 ? '' : 's'}`}
            icon="people-outline"
            toolbar={null}
            footer={
              pageCount > 1 ? (
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              ) : undefined
            }
          >
            {query.isLoading && !query.data ? (
              <View style={styles.centered}>
                <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                <Typography variant="small" muted>
                  Loading users…
                </Typography>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.empty}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                      borderColor: glassUi.border.subtle,
                    },
                  ]}
                >
                  <Ionicons
                    name="people-outline"
                    size={28}
                    color={theme.app.dashboard.accentBlue}
                  />
                </View>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  No users found
                </Typography>
                <Typography variant="small" muted style={{ textAlign: 'center' }}>
                  {search.trim()
                    ? 'Try a different search or filter.'
                    : 'Create a user to grant access.'}
                </Typography>
                {canCreate ? (
                  <Button size="compact" onPress={openCreate}>
                    Add user
                  </Button>
                ) : null}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {rows.map((row) => {
                  const internal = isInternalType(row.userType);
                  return (
                    <Pressable
                      key={row.id}
                      onPress={() => {
                        if (canUpdate) openEdit(row);
                      }}
                      disabled={!canUpdate && !canDelete}
                      style={({ pressed }) => [
                        styles.rowCard,
                        {
                          backgroundColor: theme.app.dashboard.overlayLight,
                          borderColor: theme.app.dashboard.cardBorder,
                          opacity: pressed && canUpdate ? 0.9 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.rowIcon,
                          {
                            backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                            borderColor: glassUi.border.subtle,
                          },
                        ]}
                      >
                        <Ionicons
                          name={internal ? 'shield-outline' : 'person-outline'}
                          size={18}
                          color={theme.app.dashboard.accentBlue}
                        />
                      </View>
                      <View style={styles.rowBody}>
                        <View style={styles.rowTitleLine}>
                          <Typography
                            variant="medium16"
                            style={styles.rowTitle}
                            numberOfLines={1}
                          >
                            {row.name}
                          </Typography>
                          <StatusChip
                            label={internal ? 'Internal' : 'External'}
                            tone={internal ? 'info' : 'success'}
                          />
                        </View>
                        <Typography variant="small" muted numberOfLines={1}>
                          {row.email}
                          {row.roleName ? ` · ${row.roleName}` : ''}
                        </Typography>
                      </View>
                      <View style={styles.rowActions}>
                        {canUpdate ? (
                          <Pressable
                            onPress={() => openEdit(row)}
                            hitSlop={8}
                            style={[
                              styles.iconBtn,
                              {
                                backgroundColor: `${theme.app.dashboard.accentBlue}18`,
                                borderColor: glassUi.border.subtle,
                              },
                            ]}
                          >
                            <Ionicons
                              name="create-outline"
                              size={16}
                              color={theme.app.dashboard.accentBlue}
                            />
                          </Pressable>
                        ) : null}
                        {canDelete ? (
                          <Pressable
                            onPress={() => setDeleteId(row.id)}
                            hitSlop={8}
                            style={[
                              styles.iconBtn,
                              {
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                borderColor: 'rgba(239, 68, 68, 0.28)',
                              },
                            ]}
                          >
                            <Ionicons name="trash-outline" size={16} color={theme.app.danger} />
                          </Pressable>
                        ) : null}
                        {!canUpdate && !canDelete ? (
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color={theme.app.text.secondary}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ListTableCard>
        )}
      </ScrollView>

      <AddUserModal
        key={editUserId ?? 'user-create'}
        open={modalOpen}
        editUserId={editUserId ?? undefined}
        onClose={() => {
          setModalOpen(false);
          setEditUserId(null);
        }}
        onSaved={() => void query.refetch()}
      />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete user?"
        description="This soft-deletes the user account."
        confirmLabel="Delete"
        confirmButtonVariant="danger"
        isLoading={deleteMutation.isPending}
        onDismiss={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deleteMutation.mutateAsync(deleteId);
            setDeleteId(null);
          } catch (err) {
            Alert.alert('Delete failed', extractApiErrorMessage(err));
          }
        }}
      />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 28 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  addCta: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  addCtaGlow: {
    position: 'absolute',
    top: -24,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  addCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addCtaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  centered: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  empty: {
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowTitle: { flex: 1, fontWeight: '700' },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
