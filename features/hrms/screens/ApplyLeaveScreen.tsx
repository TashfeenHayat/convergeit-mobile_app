import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MobileScreen } from '@/components/layout';
import { AppCard, Button, InputField, Typography } from '@/components/ui';
import {
  getMyLeaveApplications,
  submitLeaveApplication,
} from '@/api/hrms/leave-applications.api';
import { listLeaveTypesForApply } from '@/api/hrms/leave-types.api';
import { extractApiErrorMessage, extractNestFieldErrors } from '@/lib/api/errors';
import {
  formatIsoDate,
  isRecord,
  pickStr,
  unwrapApiData,
} from '@/lib/utils/core';
import { useAppTheme } from '@/theme';

type LeaveTypeOption = { id: string; name: string };

type MyLeaveRow = {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

function parseLeaveTypes(data: unknown): LeaveTypeOption[] {
  const payload = unwrapApiData(data);
  const items = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.items)
      ? payload.items
      : [];
  return items
    .filter(isRecord)
    .map((r) => {
      const id = pickStr(r, ['id']);
      const name = pickStr(r, ['name']);
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((x): x is LeaveTypeOption => x !== null);
}

function parseMyLeaves(data: unknown): MyLeaveRow[] {
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
}

export function ApplyLeaveScreen() {
  const theme = useAppTheme();
  const qc = useQueryClient();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const typesQuery = useQuery({
    queryKey: ['hrms', 'leave-types', 'for-apply'],
    queryFn: () => listLeaveTypesForApply(),
  });

  const myLeavesQuery = useQuery({
    queryKey: ['hrms', 'leave-applications', 'me'],
    queryFn: () => getMyLeaveApplications({ page: 1, limit: 50 }),
  });

  const leaveTypes = useMemo(() => parseLeaveTypes(typesQuery.data), [typesQuery.data]);
  const myLeaves = useMemo(() => parseMyLeaves(myLeavesQuery.data), [myLeavesQuery.data]);

  const submitMutation = useMutation({
    mutationFn: () =>
      submitLeaveApplication({
        leaveTypeId: leaveTypeId.trim(),
        startDate: startDate.trim(),
        endDate: endDate.trim(),
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      setLeaveTypeId('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setFieldErrors({});
      await qc.invalidateQueries({ queryKey: ['hrms', 'leave-applications'] });
      Alert.alert('Submitted', 'Your leave request was sent for approval.');
    },
    onError: (err) => {
      const fields = extractNestFieldErrors(err);
      if (Object.keys(fields).length) {
        setFieldErrors(fields as Record<string, string>);
      }
      Alert.alert('Submit failed', extractApiErrorMessage(err));
    },
  });

  const onSubmit = () => {
    const next: Record<string, string> = {};
    if (!leaveTypeId.trim()) next.leaveTypeId = 'Select a leave type.';
    if (!startDate.trim()) next.startDate = 'Enter start date (YYYY-MM-DD).';
    if (!endDate.trim()) next.endDate = 'Enter end date (YYYY-MM-DD).';
    if (!reason.trim()) next.reason = 'Enter a reason.';
    if (Object.keys(next).length) {
      setFieldErrors(next);
      return;
    }
    setFieldErrors({});
    submitMutation.mutate();
  };

  return (
    <MobileScreen>
      <View style={{ gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs }}>
          <Typography variant="boldLarge">Apply Leave</Typography>
          <Typography variant="medium" muted>
            Choose leave type, dates, and reason. Requests follow the normal approval flow.
          </Typography>
        </View>

        <AppCard style={{ gap: theme.spacing.md }}>
          <Typography variant="medium16">Leave type</Typography>
          {typesQuery.isLoading ? (
            <ActivityIndicator color={theme.app.dashboard.accentBlue} />
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {leaveTypes.map((opt) => {
                const selected = opt.id === leaveTypeId;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => {
                      setLeaveTypeId(opt.id);
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.leaveTypeId;
                        return next;
                      });
                    }}
                    style={[
                      styles.typeChip,
                      {
                        borderColor: selected
                          ? theme.app.dashboard.accentBlue
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: selected
                          ? theme.app.dashboard.pillActive
                          : theme.app.dashboard.surface,
                      },
                    ]}
                  >
                    <Typography variant="medium">{opt.name}</Typography>
                  </Pressable>
                );
              })}
              {leaveTypes.length === 0 ? (
                <Typography variant="small" muted>
                  No leave types available for apply.
                </Typography>
              ) : null}
            </View>
          )}
          {fieldErrors.leaveTypeId ? (
            <Typography variant="small" color={theme.app.danger}>
              {fieldErrors.leaveTypeId}
            </Typography>
          ) : null}

          <InputField
            label="Start date"
            placeholder="YYYY-MM-DD"
            value={startDate}
            onChangeText={setStartDate}
            autoCapitalize="none"
            error={Boolean(fieldErrors.startDate)}
            helperText={fieldErrors.startDate}
          />
          <InputField
            label="End date"
            placeholder="YYYY-MM-DD"
            value={endDate}
            onChangeText={setEndDate}
            autoCapitalize="none"
            error={Boolean(fieldErrors.endDate)}
            helperText={fieldErrors.endDate}
          />
          <InputField
            label="Reason"
            placeholder="Brief reason for leave"
            value={reason}
            onChangeText={setReason}
            multiline
            error={Boolean(fieldErrors.reason)}
            helperText={fieldErrors.reason}
          />

          <Button fullWidth loading={submitMutation.isPending} onPress={onSubmit}>
            Submit request
          </Button>
        </AppCard>

        <Typography variant="medium16">My recent requests</Typography>
        {myLeavesQuery.isLoading ? (
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        ) : myLeavesQuery.isError ? (
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(myLeavesQuery.error)}
          </Typography>
        ) : (
          <FlatList
            data={myLeaves}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: theme.spacing.sm }}
            refreshControl={
              <RefreshControl
                refreshing={myLeavesQuery.isRefetching}
                onRefresh={() => void myLeavesQuery.refetch()}
              />
            }
            ListEmptyComponent={
              <AppCard>
                <Typography variant="medium" muted>
                  No leave requests yet.
                </Typography>
              </AppCard>
            }
            renderItem={({ item }) => (
              <AppCard style={{ gap: 4, padding: theme.spacing.lg }}>
                <Typography variant="medium16">{item.leaveType}</Typography>
                <Typography variant="small" muted>
                  {item.startDate} → {item.endDate}
                </Typography>
                <Typography variant="small">{item.status}</Typography>
              </AppCard>
            )}
          />
        )}
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  typeChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
