import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  FormModal,
  InputField,
  SelectField,
  TimeField,
  Typography,
} from '@/components/ui';
import { WorkingWeekDayToggles } from '@/features/hrms/components/WorkingWeekDayToggles';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  sessionMayPickInternalUserScope,
  useAuth,
  type SessionScopeUser,
} from '@/lib/auth';
import {
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import {
  useCompaniesByResellerQuery,
  useCompaniesSetupResellersQuery,
} from '@/lib/hooks/query/companies';
import {
  useCreateShiftMutation,
  useUpdateShiftMutation,
} from '@/lib/hooks/query/hrms/shifts';
import { buildTimezoneSelectOptions } from '@/lib/utils/core/timezone-options';
import {
  clampWorkingDaysMask,
  HRMS_DEFAULT_WORKING_DAYS_MASK,
} from '@/lib/utils/hrms/shift-working-days';
import { useAppTheme } from '@/theme';

export type ShiftEditRow = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: string;
  timezone: string;
  workingDaysMask?: number;
};

export type AddShiftModalProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editShift?: ShiftEditRow | null;
};

/**
 * Add / Edit shift — web parity (`dashboard/shifts` FormModal).
 * Create: name, optional template scope (+ reseller/parent), daily schedule, working week.
 */
export function AddShiftModal({
  open,
  onClose,
  onSaved,
  editShift = null,
}: AddShiftModalProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const { isPlatformAdmin, user: authUser } = useAuth();
  const mayPickInternal = useMemo(
    () =>
      sessionMayPickInternalUserScope(
        isPlatformAdmin,
        authUser as SessionScopeUser | null,
      ),
    [isPlatformAdmin, authUser],
  );

  const editId = editShift?.id?.trim() ?? '';
  const isEdit = editId.length > 0;

  const [name, setName] = useState('');
  const [catalogScope, setCatalogScope] = useState<'platform' | 'tenant'>(
    'platform',
  );
  const [ownerResellerId, setOwnerResellerId] = useState('');
  const [ownerParentCompanyId, setOwnerParentCompanyId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('60');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [workingMask, setWorkingMask] = useState(HRMS_DEFAULT_WORKING_DAYS_MASK);

  const createMutation = useCreateShiftMutation();
  const updateMutation = useUpdateShiftMutation();
  const saving = createMutation.isPending || updateMutation.isPending;

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: open && mayPickInternal && !isEdit && catalogScope === 'tenant',
  });
  const parentCompaniesQuery = useCompaniesByResellerQuery(
    ownerResellerId.trim(),
    { view: 'tree', sortBy: 'name', sortOrder: 'asc', all: true },
    {
      enabled:
        open &&
        mayPickInternal &&
        !isEdit &&
        catalogScope === 'tenant' &&
        ownerResellerId.trim().length > 0,
    },
  );

  const resellerOptions = useMemo(() => {
    const base = pickItemsArray(resellersQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    return [
      {
        value: '',
        label: resellersQuery.isLoading
          ? 'Loading resellers…'
          : '— Select reseller —',
      },
      ...base,
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentOptions = useMemo(() => {
    const base = extractParentCompaniesFromByResellerTree(
      parentCompaniesQuery.data,
    );
    return [
      {
        value: '',
        label:
          ownerResellerId.trim().length === 0
            ? 'Select reseller first'
            : parentCompaniesQuery.isLoading
              ? 'Loading parent companies…'
              : '— Select parent company —',
      },
      ...base,
    ];
  }, [
    parentCompaniesQuery.data,
    parentCompaniesQuery.isLoading,
    ownerResellerId,
  ]);

  const timezoneOptions = useMemo(
    () => buildTimezoneSelectOptions(timezone),
    [timezone],
  );

  useEffect(() => {
    if (!open) return;
    if (isEdit && editShift) {
      setName(editShift.name === '—' ? '' : editShift.name);
      setStartTime(
        editShift.startTime === '—' ? '' : editShift.startTime,
      );
      setEndTime(editShift.endTime === '—' ? '' : editShift.endTime);
      setBreakMinutes(editShift.breakMinutes || '60');
      setTimezone(editShift.timezone || 'Asia/Karachi');
      setWorkingMask(
        clampWorkingDaysMask(
          editShift.workingDaysMask ?? HRMS_DEFAULT_WORKING_DAYS_MASK,
        ),
      );
      return;
    }
    setName('');
    setCatalogScope('platform');
    setOwnerResellerId('');
    setOwnerParentCompanyId('');
    setStartTime('');
    setEndTime('');
    setBreakMinutes('60');
    setTimezone('Asia/Karachi');
    setWorkingMask(HRMS_DEFAULT_WORKING_DAYS_MASK);
  }, [open, isEdit, editShift]);

  useEffect(() => {
    setOwnerParentCompanyId('');
  }, [ownerResellerId]);

  useEffect(() => {
    if (catalogScope === 'platform') {
      setOwnerResellerId('');
      setOwnerParentCompanyId('');
    }
  }, [catalogScope]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a shift name.');
      return;
    }
    if (!startTime.trim()) {
      Alert.alert('Validation', 'Please enter a start time.');
      return;
    }
    if (!endTime.trim()) {
      Alert.alert('Validation', 'Please enter an end time.');
      return;
    }
    const breakVal = breakMinutes.trim()
      ? Number(breakMinutes.trim())
      : null;
    if (breakMinutes.trim() && !Number.isFinite(breakVal)) {
      Alert.alert('Validation', 'Break minutes must be a number.');
      return;
    }
    if (!timezone.trim()) {
      Alert.alert('Validation', 'Please enter a timezone.');
      return;
    }
    if (
      !isEdit &&
      mayPickInternal &&
      catalogScope === 'tenant' &&
      (!ownerResellerId.trim() || !ownerParentCompanyId.trim())
    ) {
      Alert.alert(
        'Validation',
        'For an external (client) template, select reseller and parent company.',
      );
      return;
    }

    const body = {
      name: trimmed,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      ...(breakVal != null ? { breakMinutes: breakVal } : {}),
      timezone: timezone.trim(),
      workingDaysMask: clampWorkingDaysMask(workingMask),
      ...(!isEdit &&
      mayPickInternal &&
      catalogScope === 'tenant'
        ? {
            ownerResellerId: ownerResellerId.trim(),
            ownerParentCompanyId: ownerParentCompanyId.trim(),
          }
        : {}),
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: editId, body });
      } else {
        await createMutation.mutateAsync(body);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      Alert.alert(
        'Save failed',
        extractApiErrorMessage(
          err,
          isEdit ? 'Could not update shift.' : 'Could not create shift.',
        ),
      );
    }
  };

  return (
    <FormModal
      open={open}
      title={isEdit ? 'Edit shift' : 'Add shift'}
      description={
        isEdit
          ? 'Update name, schedule, timezone, and weekly working pattern for this template.'
          : 'Create a shift template (weekly pattern + timezone). External sessions create external-scoped templates automatically.'
      }
      onClose={handleClose}
      onSave={() => void handleSave()}
      primaryButtonLabel={saving ? 'Saving…' : isEdit ? 'Save' : 'Save shift'}
      primaryButtonDisabled={saving}
      cancelButtonLabel="Close"
    >
      <View style={{ gap: 14 }}>
        <InputField
          label="Shift name"
          placeholder="Morning"
          value={name}
          onChangeText={setName}
        />

        {!isEdit && mayPickInternal ? (
          <SelectField
            label="Template scope"
            value={catalogScope}
            onChange={(v) =>
              setCatalogScope(v === 'tenant' ? 'tenant' : 'platform')
            }
            options={[
              { value: 'platform', label: 'Internal (shared catalog)' },
              {
                value: 'tenant',
                label: 'External (reseller + parent company)',
              },
            ]}
          />
        ) : null}

        {!isEdit && mayPickInternal && catalogScope === 'tenant' ? (
          <>
            <SelectField
              label="Reseller"
              value={ownerResellerId}
              onChange={setOwnerResellerId}
              options={resellerOptions}
            />
            <SelectField
              label="Parent company"
              value={ownerParentCompanyId}
              onChange={setOwnerParentCompanyId}
              options={parentOptions}
              disabled={!ownerResellerId.trim()}
            />
          </>
        ) : null}

        <View
          style={[
            styles.sectionHead,
            { borderLeftColor: accent },
          ]}
        >
          <Typography variant="small" muted style={styles.sectionLabel}>
            Daily schedule
          </Typography>
          <Typography variant="small" muted>
            Wall-clock start/end, break length, and IANA timezone used for
            attendance and weekly off detection.
          </Typography>
        </View>

        <TimeField
          label="Start time"
          value={startTime}
          onChange={setStartTime}
        />
        <TimeField
          label="End time"
          value={endTime}
          onChange={setEndTime}
        />
        <InputField
          label="Break minutes"
          placeholder="60"
          value={breakMinutes}
          onChangeText={setBreakMinutes}
          keyboardType="number-pad"
        />
        <SelectField
          label="Timezone"
          value={timezone}
          onChange={setTimezone}
          options={timezoneOptions}
        />

        <WorkingWeekDayToggles
          value={workingMask}
          onChange={setWorkingMask}
          disabled={saving}
        />
      </View>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  sectionHead: {
    marginTop: 4,
    paddingLeft: 12,
    borderLeftWidth: 3,
    gap: 4,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontSize: 11,
  },
});
