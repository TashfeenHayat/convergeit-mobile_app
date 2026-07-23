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

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  Calendar,
  DataCardGrid,
  EntityListCard,
  FormModal,
  InputField,
  ListTableCard,
  SelectField,
  TablePagination,
  Typography,
} from '@/components/ui';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  useLeaveTypesForApplyQuery,
  useMyLeaveApplicationsQuery,
  useSubmitLeaveApplicationMutation,
} from '@/lib/hooks/query/hrms';
import { OP } from '@/lib/permissions';
import { glassUi } from '@/lib/theme/glass-ui';
import { formatIsoDate, isRecord, pickNum, pickStr, unwrapApiData } from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

/** Network parity: GET /hrms/leave-applications/me?page=1&limit=8 */
const PAGE_LIMIT = 8;

type MyLeaveRow = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

/**
 * Apply Leave (Employee) — web parity list + apply modal.
 * On load: leave-types/for-apply?all=true + leave-applications/me?page=1&limit=8
 */
export function ApplyLeaveScreen() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { hasOperational } = useAuth();
  const canApplyLeave = hasOperational(OP.hrms.leave.apply);

  const [page, setPage] = useState(1);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** GET /hrms/leave-types/for-apply?all=true */
  const leaveTypesQuery = useLeaveTypesForApplyQuery(
    { all: true },
    { enabled: true, scope: 'apply-leave' },
  );

  /** GET /hrms/leave-applications/me?page=1&limit=8 */
  const myLeavesQuery = useMyLeaveApplicationsQuery(
    { page, limit: PAGE_LIMIT },
    { enabled: true, scope: 'apply-leave' },
  );

  const submitMutation = useSubmitLeaveApplicationMutation();

  const leaveTypeOptions = useMemo(() => {
    const payload = unwrapApiData(leaveTypesQuery.data);
    const obj = isRecord(payload) ? payload : null;
    const items = Array.isArray(obj?.items)
      ? (obj.items as unknown[]).filter(isRecord)
      : [];
    const base = items
      .map((r) => {
        const id = pickStr(r, ['id']);
        const name = pickStr(r, ['name']);
        if (!id || !name) return null;
        return { value: id, label: name };
      })
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: leaveTypesQuery.isLoading
          ? 'Loading leave types…'
          : '— Select leave type —',
      },
      ...base,
    ];
  }, [leaveTypesQuery.data, leaveTypesQuery.isLoading]);

  const myPayload = unwrapApiData(myLeavesQuery.data);
  const myObj = isRecord(myPayload) ? myPayload : null;

  const myItems = useMemo(() => {
    const arr = myObj?.items;
    return Array.isArray(arr) ? (arr as unknown[]).filter(isRecord) : [];
  }, [myObj]);

  const totalEntries = useMemo(() => {
    const n = pickNum(myObj, ['total', 'count', 'totalCount']);
    return n ?? myItems.length;
  }, [myObj, myItems.length]);

  const pageCount = useMemo(() => {
    const n = pickNum(myObj, ['totalPages']);
    return n && n > 0 ? n : Math.max(1, Math.ceil(totalEntries / PAGE_LIMIT));
  }, [myObj, totalEntries]);

  const myRows = useMemo((): MyLeaveRow[] => {
    return myItems
      .map((r) => {
        const id = pickStr(r, ['id']);
        if (!id) return null;
        const typeName =
          pickStr(isRecord(r.leaveType) ? r.leaveType : null, ['name']) ||
          pickStr(r, ['leaveTypeName']) ||
          '—';
        return {
          id,
          leaveType: typeName,
          startDate: formatIsoDate(pickStr(r, ['startDate', 'effectiveFrom'])),
          endDate: formatIsoDate(pickStr(r, ['endDate', 'effectiveTo'])),
          status: pickStr(r, ['status', 'approvalStatus', 'stage']) || '—',
        };
      })
      .filter((x): x is MyLeaveRow => x !== null);
  }, [myItems]);

  const footerRangeStart =
    myRows.length > 0 ? (page - 1) * PAGE_LIMIT + 1 : 0;
  const footerRangeEnd = (page - 1) * PAGE_LIMIT + myRows.length;

  useEffect(() => {
    setPage((p) => (p > pageCount ? pageCount : p));
  }, [pageCount]);

  const resetForm = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setFieldErrors({});
  };

  const closeApplyModal = () => {
    if (submitMutation.isPending) return;
    resetForm();
    setApplyModalOpen(false);
  };

  const handleSubmit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!leaveType.trim()) nextErrors.leaveTypeId = 'Please select leave type.';
    if (!startDate.trim()) nextErrors.startDate = 'Please enter start date.';
    if (!endDate.trim()) nextErrors.endDate = 'Please enter end date.';
    if (!reason.trim()) nextErrors.reason = 'Please enter reason.';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});
    try {
      await submitMutation.mutateAsync({
        leaveTypeId: leaveType.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        reason: reason.trim(),
      });
      Alert.alert('Submitted', 'Leave applied successfully.');
      resetForm();
      setApplyModalOpen(false);
      void myLeavesQuery.refetch();
    } catch (err) {
      const fields = extractNestFieldErrors(err);
      if (fields.leaveType && !fields.leaveTypeId) {
        fields.leaveTypeId = fields.leaveType;
      }
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
        return;
      }
      Alert.alert(
        'Submit failed',
        extractApiErrorMessage(err, 'Could not submit leave application.'),
      );
    }
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={
              myLeavesQuery.isRefetching && !myLeavesQuery.isLoading
            }
            onRefresh={() => {
              void leaveTypesQuery.refetch();
              void myLeavesQuery.refetch();
            }}
            tintColor={accent}
          />
        } showsVerticalScrollIndicator={false}>
        <DashboardPageIntro subtitle="Submit leave application and track approval stages.">
          {canApplyLeave ? (
            <Pressable
              onPress={() => setApplyModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Apply leave"
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
                  Apply leave
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  Submit a new leave request
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
        </DashboardPageIntro>

        {!canApplyLeave ? (
          <AppCard>
            <Typography variant="medium" muted>
              You do not have permission to apply leave.
            </Typography>
          </AppCard>
        ) : myLeavesQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                myLeavesQuery.error,
                'Could not load leave applications.',
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void myLeavesQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="My leave applications"
            subtitle={undefined}
            icon="cash-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={myLeavesQuery.isLoading && !myLeavesQuery.data}
              empty={!myLeavesQuery.isLoading && myRows.length === 0}
              emptyState={{
                title: 'No records yet',
                description:
                  'There is no data available for the current filter.',
                icon: 'time-outline',
                action: canApplyLeave ? (
                  <Button
                    size="compact"
                    onPress={() => setApplyModalOpen(true)}
                  >
                    Apply leave
                  </Button>
                ) : undefined,
              }}
              showingLabel={`Showing data ${footerRangeStart} to ${footerRangeEnd} of ${totalEntries} entries`}
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
 />
              }
            >
              {myRows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.leaveType}
                  details={[
                    { label: 'Leave type', value: row.leaveType },
                    { label: 'Start', value: row.startDate },
                    { label: 'End', value: row.endDate },
                    { label: 'Status', value: row.status },
                  ]}
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={applyModalOpen}
        title="Apply leave"
        description="Choose leave type, dates, and reason. Your request will follow the normal approval flow."
        onClose={closeApplyModal}
        onSave={() => void handleSubmit()}
        primaryButtonLabel={
          submitMutation.isPending ? 'Submitting…' : 'Submit'
        }
        primaryButtonDisabled={submitMutation.isPending}
        cancelButtonLabel="Cancel"
      >
        <View style={{ gap: 12 }}>
          <SelectField
            label="Leave Type"
            value={leaveType}
            onChange={(v) => {
              setLeaveType(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.leaveTypeId;
                delete next.leaveType;
                return next;
              });
            }}
            options={leaveTypeOptions}
 />
          {fieldErrors.leaveTypeId || fieldErrors.leaveType ? (
            <Typography variant="small" color={theme.app.danger}>
              {fieldErrors.leaveTypeId || fieldErrors.leaveType}
            </Typography>
          ) : null}

          <Calendar
            label="Start Date"
            value={startDate}
            onChange={(v) => {
              setStartDate(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.startDate;
                return next;
              });
            }}
            error={Boolean(fieldErrors.startDate)}
            helperText={fieldErrors.startDate}
 />
          <Calendar
            label="End Date"
            value={endDate}
            min={startDate || undefined}
            onChange={(v) => {
              setEndDate(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.endDate;
                return next;
              });
            }}
            error={Boolean(fieldErrors.endDate)}
            helperText={fieldErrors.endDate}
 />
          <InputField
            label="Reason"
            placeholder="Brief reason for leave"
            value={reason}
            onChangeText={(v) => {
              setReason(v);
              setFieldErrors((prev) => {
                const next = { ...prev };
                delete next.reason;
                return next;
              });
            }}
            multiline
            error={Boolean(fieldErrors.reason)}
            helperText={fieldErrors.reason}
 />
        </View>
      </FormModal>
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
