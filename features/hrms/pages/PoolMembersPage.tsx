import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { listHrmsPoolMembers } from '@/api/hrms';
import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  ConfirmActionModal,
  DataCardGrid,
  EntityListCard,
  FiltersSearchBar,
  FormModal,
  ListTableCard,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { AddPoolMemberModal } from '@/features/hrms/components/AddPoolMemberModal';
import { fetchMyNotificationsRest } from '@/features/notifications/api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useMovePoolMemberMutation,
  usePoolsListQuery,
  useRemovePoolMemberMutation,
} from '@/lib/hooks/query/hrms';
import { hrmsPoolMembersKeys } from '@/lib/hooks/query/hrms/pool-members/keys';
import {
  canPoolMemberAdd,
  canPoolMemberMove,
  canPoolMemberRemove,
  hasPoolPage,
} from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr, unwrapApiData } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/pool-members?page=1&limit=100 */
const API_LIMIT = 100;
const PAGE_SIZE = 20;

type MemberRow = {
  rowKey: string;
  poolId: string;
  poolName: string;
  departmentName: string;
  departmentId: string;
  userId: string;
  memberName: string;
  email: string;
};

function memberDisplayName(r: Record<string, unknown>): string {
  const first = pickStr(r, ['firstName', 'first_name']) || '';
  const last = pickStr(r, ['lastName', 'last_name']) || '';
  const joined = `${first} ${last}`.trim();
  if (joined) return joined;
  return pickStr(r, ['name', 'fullName', 'userName']) || '—';
}

function parseMemberRows(data: unknown): MemberRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const poolObj = isRecord(r.pool) ? r.pool : null;
      const userObj = isRecord(r.user) ? r.user : null;
      const membershipDept =
        poolObj && isRecord(poolObj.department) ? poolObj.department : null;
      const deptObj =
        (isRecord(r.department) ? r.department : null) ?? membershipDept;

      const poolId = pickStr(r, ['poolId']) || pickStr(poolObj, ['id']) || '';
      const poolName =
        pickStr(r, ['poolName']) ||
        pickStr(poolObj, ['name', 'poolName', 'title']) ||
        '—';
      const departmentId =
        pickStr(r, ['poolDepartmentId', 'departmentId']) ||
        pickStr(deptObj, ['id']) ||
        pickStr(poolObj, ['departmentId', 'department_id']) ||
        '';
      const departmentName =
        pickStr(r, ['poolDepartmentName', 'departmentName']) ||
        pickStr(deptObj, ['name']) ||
        '—';
      const userId =
        pickStr(r, ['userId', 'user_id', 'memberUserId']) ||
        pickStr(userObj, ['id', 'userId']) ||
        pickStr(r, ['id']) ||
        '';
      if (!poolId || !userId) return null;
      const nameSource = userObj ?? r;
      return {
        rowKey: `${poolId}:${userId}`,
        poolId,
        poolName,
        departmentName,
        departmentId,
        userId,
        memberName: memberDisplayName(nameSource),
        email: pickStr(r, ['email']) || pickStr(userObj, ['email']) || '—',
      };
    })
    .filter((x): x is MemberRow => x !== null);
}

export function PoolMembersPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational, hasPage } = useAuth();
  const hasPoolPageAccess = hasPoolPage(hasPage);
  const canAdd = hasPoolPageAccess && canPoolMemberAdd(hasOperational);
  const canMove = hasPoolPageAccess && canPoolMemberMove(hasOperational);
  const canRemove = hasPoolPageAccess && canPoolMemberRemove(hasOperational);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MemberRow | null>(null);
  const [moveTarget, setMoveTarget] = useState<MemberRow | null>(null);
  const [targetPoolId, setTargetPoolId] = useState('');

  /** GET /hrms/pool-members?page=1&limit=100 */
  const membersQuery = useQuery({
    queryKey: [
      ...hrmsPoolMembersKeys.aggregateList({ page: 1, limit: API_LIMIT }),
      'pool-members-page',
    ] as const,
    queryFn: () => listHrmsPoolMembers({ page: 1, limit: API_LIMIT }),
  });

  /** GET /notifications/me?unreadOnly=true — same hub bootstrap as web */
  useQuery({
    queryKey: ['notifications', 'me', { unreadOnly: true }, 'pool-members-page'] as const,
    queryFn: () => fetchMyNotificationsRest({ unreadOnly: true }),
  });

  const moveDeptId = moveTarget?.departmentId?.trim() ?? '';
  const poolsInDeptQuery = usePoolsListQuery(
    moveTarget
      ? moveDeptId
        ? { departmentId: moveDeptId, all: true }
        : { all: true }
      : undefined,
    {
      enabled: Boolean(moveTarget),
      scope: 'pool-members-move',
    },
  );

  const moveMutation = useMovePoolMemberMutation();
  const removeMutation = useRemovePoolMemberMutation();

  const allRows = useMemo(
    () => parseMemberRows(membersQuery.data),
    [membersQuery.data],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter((row) => {
      const hay = `${row.memberName} ${row.email} ${row.poolName} ${row.departmentName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [allRows, search]);

  const total = filteredRows.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const rows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, page]);

  const movePoolOptions = useMemo(() => {
    const base = pickApiItems(unwrapApiData(poolsInDeptQuery.data))
      .filter(isRecord)
      .map((r) => {
        const id = pickStr(r, ['id']);
        const name = pickStr(r, ['name', 'poolName']);
        if (!id) return null;
        return { value: id, label: name || id };
      })
      .filter((x): x is { value: string; label: string } => x !== null)
      .filter((o) => !moveTarget || o.value !== moveTarget.poolId);
    return [
      {
        value: '',
        label: poolsInDeptQuery.isLoading ? 'Loading pools…' : '— Target pool —',
      },
      ...base,
    ];
  }, [poolsInDeptQuery.data, poolsInDeptQuery.isLoading, moveTarget]);

  useEffect(() => {
    if (searchInput.trim().length > 0) return;
    if (!search.trim()) return;
    setSearch('');
    setPage(1);
  }, [searchInput, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={membersQuery.isRefetching && !membersQuery.isLoading}
            onRefresh={() => void membersQuery.refetch()}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Open Add pool member to assign someone to a pool. The table lists members for the department scope you set with Filter (next to Search).">
          {canAdd ? (
            <Pressable
              onPress={() => setModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Add pool member"
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
                <Ionicons name="person-add-outline" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.addCtaCopy}>
                <Typography variant="medium16" style={{ fontWeight: '700' }}>
                  Add pool member
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Assign a user to a pool
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

          <FiltersSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSearch={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
            placeholder="Member name or email…"
            filtersOpen={filtersOpen}
            onFilterPress={() => setFiltersOpen((v) => !v)}
            hasActiveFilters={Boolean(search.trim())}
          >
            {filtersOpen ? (
              <Typography variant="small" muted>
                Showing pool members in your scope. Use Filter to set department
                (Internal / External + reseller / parent when needed), then pick a pool
                below for team attendance.
              </Typography>
            ) : null}
          </FiltersSearchBar>
        </DashboardPageIntro>

        {membersQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                membersQuery.error,
                'Could not load pool members.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void membersQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Pools & members"
            subtitle="Showing pool members in your scope. Use Filter to set department (Internal / External + reseller / parent when needed), then pick a pool below for team attendance."
            icon="people-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={membersQuery.isLoading && !membersQuery.data}
              empty={!membersQuery.isLoading && rows.length === 0}
              emptyState={{
                title: 'No pool members',
                description: 'Add a member to a pool to see them here.',
                icon: 'people-outline',
                action: canAdd ? (
                  <Button
                    size="compact"
                    onPress={() => setModalOpen(true)}
                  >
                    Add pool member
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                total > 0
                  ? `Showing ${from}–${to} of ${total} members`
                  : undefined
              }
              footerRight={
                <TablePagination page={page} pageCount={pageCount} onPageChange={setPage} />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.rowKey}
                  title={row.memberName}
                  details={[
                    { label: 'Pool', value: row.poolName },
                    { label: 'Department', value: row.departmentName },
                    { label: 'Email', value: row.email },
                  ]}
                  onEditPress={
                    canMove
                      ? () => {
                          setMoveTarget(row);
                          setTargetPoolId('');
                        }
                      : undefined
                  }
                  onDeletePress={
                    canRemove ? () => setDeleteTarget(row) : undefined
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={Boolean(moveTarget)}
        title="Move member to another pool"
        description={
          moveTarget
            ? `Move “${moveTarget.memberName}” from “${moveTarget.poolName}” to another pool in this department.`
            : 'Move this member.'
        }
        onClose={() => {
          if (moveMutation.isPending) return;
          setMoveTarget(null);
          setTargetPoolId('');
        }}
        onSave={async () => {
          if (!moveTarget || !targetPoolId.trim() || targetPoolId === moveTarget.poolId) {
            Alert.alert('Validation', 'Pick a different pool in this department.');
            return;
          }
          try {
            await moveMutation.mutateAsync({
              poolId: moveTarget.poolId,
              userId: moveTarget.userId,
              targetPoolId: targetPoolId.trim(),
            });
            setMoveTarget(null);
            setTargetPoolId('');
            void membersQuery.refetch();
          } catch (err) {
            Alert.alert('Move failed', extractApiErrorMessage(err));
          }
        }}
        primaryButtonLabel={moveMutation.isPending ? 'Moving…' : 'Move'}
        primaryButtonDisabled={moveMutation.isPending || !targetPoolId.trim()}
        cancelButtonLabel="Close"
      >
        <SelectField
          label="Target pool"
          value={targetPoolId}
          onChange={setTargetPoolId}
          options={movePoolOptions}
 />
      </FormModal>

      <AddPoolMemberModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          void membersQuery.refetch();
        }}
 />

      <ConfirmActionModal
        open={Boolean(deleteTarget)}
        title="Remove from pool?"
        description={
          deleteTarget
            ? `Remove “${deleteTarget.memberName}” from pool “${deleteTarget.poolName}”?`
            : 'This user will be removed from the pool.'
        }
        confirmLabel="Remove"
        confirmButtonVariant="danger"
        isLoading={removeMutation.isPending}
        onDismiss={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await removeMutation.mutateAsync({
              poolId: deleteTarget.poolId,
              userId: deleteTarget.userId,
            });
            setDeleteTarget(null);
            void membersQuery.refetch();
          } catch (err) {
            Alert.alert('Remove failed', extractApiErrorMessage(err));
          }
        }}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
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
