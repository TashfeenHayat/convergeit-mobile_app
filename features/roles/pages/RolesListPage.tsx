import { useMemo, useState } from 'react';
import {
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
  DataCardGrid,
  EntityListCard,
  ListTableCard,
  SearchBar,
  TablePagination,
  Typography,
} from '@/components/ui';
import { RoleFormModal } from '@/features/roles/components/RoleFormModal';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { canRoleAction } from '@/lib/permissions';
import { useRolesListQuery, useSoftDeleteRoleMutation } from '@/lib/hooks/query/roles';
import { glassUi } from '@/lib/theme/glass-ui';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import { useAppTheme } from '@/theme';

const PAGE_SIZE = 20;

type RoleRow = { id: string; name: string; userCount: number };

function pickUserCount(row: Record<string, unknown>): number {
  /** Web parity: Prisma `_count.users`, then flat count fields. */
  const countObj = isRecord(row._count) ? row._count : null;
  const raw =
    (countObj ? countObj.users : undefined) ??
    row.userCount ??
    row.usersCount ??
    row.totalUsers ??
    row.assignedUsers ??
    row.user_count ??
    row.memberCount ??
    row.users;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() && !Number.isNaN(Number(raw))) {
    return Number(raw);
  }
  if (Array.isArray(raw)) return raw.length;
  return 0;
}

function parseRows(data: unknown): RoleRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      return {
        id,
        name: pickStr(r, ['name']) || '—',
        userCount: pickUserCount(r),
      };
    })
    .filter((x): x is RoleRow => x !== null);
}

export function RolesListPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();
  const canManage = canRoleAction(hasOperational);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState<RoleRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  /** Web parity: GET /roles?page=1&limit=20 */
  const query = useRolesListQuery({
    page,
    limit: PAGE_SIZE,
    ...(search.trim() ? { search: search.trim() } : {}),
  });
  const deleteMutation = useSoftDeleteRoleMutation();

  const rows = useMemo(() => parseRows(query.data), [query.data]);
  const total = pickApiTotal(query.data, rows.length);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const applySearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
  };

  const openCreate = () => {
    setEditRow(null);
    setModalOpen(true);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Access roles for users across the platform.">
          {canManage ? (
            <Pressable
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Add New Role"
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
              <View style={[styles.addCtaGlow, { backgroundColor: `${accent}18` }]} />
              <View
                style={[
                  styles.addCtaIcon,
                  { backgroundColor: accent, borderColor: `${accent}66` },
                ]}
              >
                <Ionicons name="add" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Add New Role
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Create a role and assign permissions
                </Typography>
              </View>
              <View
                style={[
                  styles.addCtaChevron,
                  {
                    backgroundColor: `${accent}22`,
                    borderColor: glassUi.border.subtle,
                  },
                ]}
              >
                <Ionicons name="arrow-forward" size={16} color={accent} />
              </View>
            </Pressable>
          ) : null}

          <View style={styles.searchRow}>
            <View style={{ flex: 1 }}>
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSubmit={applySearch}
                placeholder="Search roles…"
 />
            </View>
            <Button size="compact" variant="secondary" onPress={applySearch}>
              Search
            </Button>
          </View>
        </DashboardPageIntro>

        {query.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, 'Could not load roles.')}
            </Typography>
            <Button size="compact" variant="outlined" onPress={() => void query.refetch()}>
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard title="Roles" subtitle={`${total} total`} icon="people-outline" toolbar={null}>
            <DataCardGrid
              columns={1}
              isLoading={query.isLoading && !query.data}
              empty={!query.isLoading && rows.length === 0}
              emptyState={{
                title: 'No roles',
                description: 'Create a role to assign permissions.',
                icon: 'people-outline',
                action: canManage ? (
                  <Button size="compact" onPress={openCreate}>
                    Add New Role
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                rows.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.name}
                  details={[
                    {
                      label: 'Users',
                      value: `${row.userCount} User${row.userCount === 1 ? '' : 's'}`,
                    },
                  ]}
                  onEditPress={
                    canManage
                      ? () => {
                          setEditRow(row);
                          setModalOpen(true);
                        }
                      : undefined
                  }
                  onDeletePress={canManage ? () => setDeleteId(row.id) : undefined}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <RoleFormModal
        open={modalOpen}
        editRole={editRow}
        onClose={() => setModalOpen(false)}
        onSaved={() => void query.refetch()}
 />

      <ConfirmActionModal
        open={Boolean(deleteId)}
        title="Delete role?"
        description="This soft-deletes the role."
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
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  addCtaCopy: { flex: 1, minWidth: 0, gap: 2 },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
