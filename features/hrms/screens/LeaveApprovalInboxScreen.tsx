import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  DataTable,
  ListTableCard,
  SegmentedControl,
  Typography,
  type DataTableColumn,
} from '@/components/ui';
import {
  decideLeaveDepartment,
  decideLeavePool,
  decideLeaveTenant,
  getPendingLeaveDepartmentQueue,
  getPendingLeavePoolQueue,
  getPendingLeaveTenantQueue,
} from '@/api/hrms/leave-applications.api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { HRMS, OP } from '@/lib/permissions';
import {
  formatIsoDate,
  isRecord,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

type QueueTab = 'pool' | 'department' | 'tenant';

type PendingRow = {
  id: string;
  employee: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
};

function parsePending(data: unknown): PendingRow[] {
  const payload = unwrapApiData(data);
  const items =
    isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : [];

  return items
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      if (!id) return null;
      const user = isRecord(r.user) ? r.user : isRecord(r.applicant) ? r.applicant : null;
      const employee =
        [pickStr(user, ['firstName']), pickStr(user, ['lastName'])].filter(Boolean).join(' ') ||
        pickStr(user, ['email', 'displayName', 'name']) ||
        pickStr(r, ['employeeName', 'userName', 'applicantName']) ||
        'Employee';
      const typeName =
        pickStr(isRecord(r.leaveType) ? r.leaveType : null, ['name']) ||
        pickStr(r, ['leaveTypeName']) ||
        '—';
      return {
        id,
        employee,
        leaveType: typeName,
        startDate: formatIsoDate(pickStr(r, ['startDate', 'effectiveFrom'])),
        endDate: formatIsoDate(pickStr(r, ['endDate', 'effectiveTo'])),
        reason: pickStr(r, ['reason', 'notes']) || '—',
      };
    })
    .filter((x): x is PendingRow => x !== null);
}

export function LeaveApprovalInboxScreen() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const { hasOperational } = useAuth();

  const canPool = hasOperational(OP.hrms.leave.approvePool) || hasOperational(HRMS.LEAVE_APPROVE_POOL);
  const canDept =
    hasOperational(OP.hrms.leave.approveDepartment) || hasOperational(HRMS.LEAVE_APPROVE_DEPT);
  const canTenant =
    hasOperational(OP.hrms.leave.approveTenant) || hasOperational(HRMS.LEAVE_APPROVE_TENANT);

  const availableTabs = useMemo(() => {
    const tabs: { label: string; value: QueueTab }[] = [];
    if (canPool) tabs.push({ label: 'Pool', value: 'pool' });
    if (canDept) tabs.push({ label: 'Dept', value: 'department' });
    if (canTenant) tabs.push({ label: 'Tenant', value: 'tenant' });
    return tabs;
  }, [canPool, canDept, canTenant]);

  const [tab, setTab] = useState<QueueTab>(availableTabs[0]?.value ?? 'pool');

  const queueQuery = useQuery({
    queryKey: ['hrms', 'leave-pending', tab],
    queryFn: async () => {
      if (tab === 'department') return getPendingLeaveDepartmentQueue({ page: 1, limit: 50 });
      if (tab === 'tenant') return getPendingLeaveTenantQueue({ page: 1, limit: 50 });
      return getPendingLeavePoolQueue({ page: 1, limit: 50 });
    },
    enabled: availableTabs.length > 0,
  });

  const rows = useMemo(() => parsePending(queueQuery.data), [queueQuery.data]);

  const decideMutation = useMutation({
    mutationFn: async (vars: { id: string; decision: 'approved' | 'rejected' }) => {
      const body = { status: vars.decision };
      if (tab === 'department') return decideLeaveDepartment(vars.id, body);
      if (tab === 'tenant') return decideLeaveTenant(vars.id, body);
      return decideLeavePool(vars.id, body);
    },
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ['hrms', 'leave-pending'] });
      Alert.alert('Done', `Request ${vars.decision}.`);
    },
    onError: (err) => Alert.alert('Action failed', extractApiErrorMessage(err)),
  });

  const columns: DataTableColumn<PendingRow>[] = useMemo(
    () => [
      { id: 'employee', label: 'Employee', minWidth: 130 },
      { id: 'leaveType', label: 'Type', minWidth: 100, cellVariant: 'muted' },
      { id: 'startDate', label: 'From', minWidth: 100, cellVariant: 'muted' },
      { id: 'endDate', label: 'To', minWidth: 100, cellVariant: 'muted' },
      {
        id: 'reason',
        label: 'Reason',
        minWidth: 140,
        nowrap: false,
        render: (value) => (
          <Typography variant="medium" numberOfLines={2} style={{ maxWidth: 160 }}>
            {String(value ?? '—')}
          </Typography>
        ),
      },
    ],
    [],
  );

  if (availableTabs.length === 0) {
    return (
      <MobileScreen>
        <AppCard style={{ gap: theme.spacing.sm }}>
          <Typography variant="boldLarge">Approval Inbox</Typography>
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
        contentContainerStyle={[styles.scroll, { paddingHorizontal: theme.spacing.screen }]}
        refreshControl={
          <RefreshControl
            refreshing={queueQuery.isRefetching && !queueQuery.isLoading}
            onRefresh={() => void queueQuery.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Typography variant="boldLarge">Approval Inbox</Typography>
            <Typography variant="medium" muted>
              Review pending leave requests in your scope.
            </Typography>
          </View>

          {availableTabs.length > 1 ? (
            <SegmentedControl
              options={availableTabs}
              value={tab}
              onChange={(v) => setTab(v as QueueTab)}
            />
          ) : null}

          {queueQuery.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(queueQuery.error, 'Could not load queue.')}
              </Typography>
            </AppCard>
          ) : (
            <ListTableCard
              title="Pending requests"
              subtitle={`${rows.length} waiting in ${tab} queue`}
              icon="clipboard-outline"
              footer={
                <Typography variant="small" muted>
                  {rows.length === 0
                    ? 'Queue is clear'
                    : `${rows.length} request${rows.length === 1 ? '' : 's'} pending`}
                </Typography>
              }
            >
              {queueQuery.isLoading && !queueQuery.data ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.app.dashboard.accentBlue} />
                </View>
              ) : (
                <DataTable
                  columns={columns}
                  rows={rows}
                  getRowId={(row) => row.id}
                  minWidth={640}
                  emptyState={{
                    title: 'No pending requests',
                    description: 'Nothing waiting in this approval queue right now.',
                    icon: 'checkmark-done-outline',
                  }}
                  actionColumn={{
                    label: 'Actions',
                    width: 168,
                    render: (row) => (
                      <View style={styles.actions}>
                        <Button
                          size="compact"
                          variant="outlined"
                          disabled={decideMutation.isPending}
                          onPress={() =>
                            decideMutation.mutate({ id: row.id, decision: 'rejected' })
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          size="compact"
                          disabled={decideMutation.isPending}
                          onPress={() =>
                            decideMutation.mutate({ id: row.id, decision: 'approved' })
                          }
                        >
                          Approve
                        </Button>
                      </View>
                    ),
                  }}
                />
              )}
            </ListTableCard>
          )}
        </View>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 32 },
  centered: { minHeight: 120, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
});
