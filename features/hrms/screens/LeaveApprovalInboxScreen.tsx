import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  DataCardGrid,
  EntityListCard,
  ListTableCard,
  SearchBar,
  TablePagination,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useDecideLeaveTenantMutation,
  usePendingLeaveTenantQueueQuery,
} from '@/lib/hooks/query/hrms';
import { HRMS, OP } from '@/lib/permissions';
import { pickApiItems, pickApiTotal } from '@/lib/utils/admin-list';
import {
  formatIsoDate,
  isRecord,
  pickNum,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Network parity: GET …/pending/tenant-queue?page=1&limit=8&all=false */
const PAGE_LIMIT = 8;

type PendingRow = {
  id: string;
  firstName: string;
  lastName: string;
  departmentName: string;
  poolName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  stage: string;
};

function extractTotalPages(data: unknown): number {
  const payload = unwrapApiData(data);
  if (!isRecord(payload)) return 1;
  const n = pickNum(payload, ['totalPages']);
  return n && n > 0 ? n : 1;
}

function parsePending(data: unknown): PendingRow[] {
  return pickApiItems(data)
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const user =
        (isRecord(r.user) ? r.user : null) ??
        (isRecord(r.applicant) ? r.applicant : null) ??
        (isRecord(r.employee) ? r.employee : null);
      const dept =
        (isRecord(r.department) ? r.department : null) ??
        (user && isRecord(user.department) ? user.department : null);
      const pool =
        (isRecord(r.pool) ? r.pool : null) ??
        (user && isRecord(user.pool) ? user.pool : null);
      const leaveTypeObj = isRecord(r.leaveType) ? r.leaveType : null;
      return {
        id,
        firstName:
          pickStr(user, ['firstName']) ||
          pickStr(r, ['firstName']) ||
          '—',
        lastName:
          pickStr(user, ['lastName']) || pickStr(r, ['lastName']) || '—',
        departmentName:
          pickStr(dept, ['name']) ||
          pickStr(r, ['departmentName']) ||
          '—',
        poolName: pickStr(pool, ['name']) || pickStr(r, ['poolName']) || '—',
        leaveType:
          pickStr(leaveTypeObj, ['name']) ||
          pickStr(r, ['leaveTypeName']) ||
          '—',
        startDate: formatIsoDate(pickStr(r, ['startDate', 'effectiveFrom'])),
        endDate: formatIsoDate(pickStr(r, ['endDate', 'effectiveTo'])),
        stage:
          pickStr(r, ['stage', 'status', 'approvalStatus', 'currentStage']) ||
          '—',
      };
    })
    .filter((x): x is PendingRow => x !== null);
}

/**
 * Approval Inbox — Department Heads.
 * Network: GET /hrms/leave-applications/pending/tenant-queue?page=1&limit=8&all=false
 */
export function LeaveApprovalInboxScreen() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();

  const canApprove =
    hasOperational(OP.hrms.leave.approveTenant) ||
    hasOperational(HRMS.LEAVE_APPROVE_TENANT) ||
    hasOperational(OP.hrms.leave.approveDepartment) ||
    hasOperational(HRMS.LEAVE_APPROVE_DEPT) ||
    hasOperational(OP.hrms.leave.approvePool) ||
    hasOperational(HRMS.LEAVE_APPROVE_POOL);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      all: false as const,
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [page, search],
  );

  /** GET /hrms/leave-applications/pending/tenant-queue?page=1&limit=8&all=false */
  const queueQuery = usePendingLeaveTenantQueueQuery(params, {
    enabled: canApprove,
    scope: 'approval-inbox-tenant',
  });

  const decideMutation = useDecideLeaveTenantMutation();

  const rows = useMemo(() => parsePending(queueQuery.data), [queueQuery.data]);
  const total = pickApiTotal(queueQuery.data, rows.length);
  const pageCount = Math.max(
    1,
    extractTotalPages(queueQuery.data) || Math.ceil(total / PAGE_LIMIT),
  );
  const rangeStart = rows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const rangeEnd = (page - 1) * PAGE_LIMIT + rows.length;

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  const decide = async (id: string, decision: 'approved' | 'rejected') => {
    try {
      await decideMutation.mutateAsync({
        id,
        body: { status: decision },
      });
      Alert.alert('Done', `Request ${decision}.`);
      void queueQuery.refetch();
    } catch (err) {
      Alert.alert('Action failed', extractApiErrorMessage(err));
    }
  };

  if (!canApprove) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have leave approval permissions.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={queueQuery.isRefetching && !queueQuery.isLoading}
            onRefresh={() => void queueQuery.refetch()}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Review pending leave applications and decide.">
          <View style={styles.scopeRow}>
            <View
              style={[
                styles.scopePill,
                {
                  backgroundColor: `${accent}22`,
                  borderColor: `${accent}55`,
                },
              ]}
            >
              <Ionicons name="people-outline" size={14} color={accent} />
              <Typography
                variant="small"
                style={{ fontWeight: '700', color: accent }}
              >
                Department Heads
              </Typography>
            </View>
          </View>
        </DashboardPageIntro>

        {queueQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                queueQuery.error,
                'Could not load pending leaves.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void queueQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Pending leaves"
            icon="time-outline"
            toolbar={
              <View style={styles.searchToolbar}>
                <View style={styles.searchField}>
                  <SearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    onSubmit={() => {
                      setSearch(searchInput.trim());
                      setPage(1);
                    }}
                    placeholder="Search anything..."
 />
                </View>
                <Button
                  size="compact"
                  variant="secondary"
                  onPress={() => {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }}
                >
                  Search
                </Button>
              </View>
            }
          >
            <DataCardGrid
              columns={1}
              isLoading={queueQuery.isLoading && !queueQuery.data}
              empty={!queueQuery.isLoading && rows.length === 0}
              emptyState={{
                title: 'No records yet',
                description:
                  'There is no data available for the current filter.',
                icon: 'time-outline',
              }}
              showingLabel={`Showing data ${rangeStart} to ${rangeEnd} of ${total} entries`}
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
 />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={`${row.firstName} ${row.lastName}`.trim()}
                  details={[
                    { label: 'First name', value: row.firstName },
                    { label: 'Last name', value: row.lastName },
                    { label: 'Department name', value: row.departmentName },
                    { label: 'Pool name', value: row.poolName },
                    { label: 'Leave Type', value: row.leaveType },
                    { label: 'Start', value: row.startDate },
                    { label: 'End', value: row.endDate },
                    { label: 'Stage', value: row.stage },
                  ]}
                  footerLabel="Actions"
                  badge={
                    <View style={styles.actions}>
                      <Button
                        size="compact"
                        variant="outlined"
                        disabled={decideMutation.isPending}
                        onPress={() => void decide(row.id, 'rejected')}
                      >
                        Reject
                      </Button>
                      <Button
                        size="compact"
                        disabled={decideMutation.isPending}
                        onPress={() => void decide(row.id, 'approved')}
                      >
                        Approve
                      </Button>
                    </View>
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scopePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  searchToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  searchField: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
});
