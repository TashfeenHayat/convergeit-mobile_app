import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  Checkbox,
  InputField,
  SelectField,
  Typography,
} from '@/components/ui';
import {
  useSaveVisitorTopicsMutation,
  useVisitorTopicsQuery,
} from '@/features/chat-settings/hooks/useServiceScheduling';
import { useWebsiteAssignmentDetailQuery } from '@/lib/hooks/query/website-assignments/hooks';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useWebsiteAssignmentGates } from '@/lib/permissions/use-website-assignment-gates';
import {
  buildVisitorTopicsSaveBody,
  emptyTopic,
  slugRoutingKey,
  topicsBundleToDraft,
  validateVisitorTopicsDraft,
} from '@/features/website-assignments/utils/service-scheduling-form.utils';
import type { ServiceSchedulingTopic } from '@/services/chat/service-scheduling.types';
import { isRecord, pickStr } from '@/lib/utils/core';
import { pickApiItems } from '@/lib/utils/admin-list';
import { glassUi } from '@/lib/theme/glass-ui';
import { useAppTheme } from '@/theme';

export type WebsiteInquireTopicsWorkspaceProps = {
  websiteId: string;
};

function mapDeptOptions(payload: unknown): { value: string; label: string }[] {
  return pickApiItems(payload)
    .filter(isRecord)
    .map((r) => {
      const value = pickStr(r, ['id']);
      if (!value) return null;
      return { value, label: pickStr(r, ['name']) || value };
    })
    .filter((x): x is { value: string; label: string } => x !== null);
}

/** Per-website visitor inquire topics — create / edit / save. */
export function WebsiteInquireTopicsWorkspace({ websiteId }: WebsiteInquireTopicsWorkspaceProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const canEdit = gates.assign;
  const accent = theme.app.dashboard.accentBlue;
  const id = websiteId.trim();

  const detailQuery = useWebsiteAssignmentDetailQuery(id, {
    enabled: gates.view && id.length > 0,
  });
  const topicsQuery = useVisitorTopicsQuery(id, gates.view && id.length > 0);
  const saveMutation = useSaveVisitorTopicsMutation(id);

  const detail = detailQuery.data?.data;
  const parentCompanyId =
    detail?.parentCompanyId?.trim() ||
    topicsQuery.data?.parentCompanyId?.trim() ||
    '';

  /** Web parity: GET /hrms/departments?type=Internal&all=true */
  const internalDeptsQuery = useDepartmentsListQuery(
    { all: true, type: 'Internal' },
    { enabled: gates.view && id.length > 0, scope: 'inquire-topics-internal' },
  );

  /** Web parity: GET /hrms/departments?type=External&parentCompanyId=&all=true */
  const externalDeptsQuery = useDepartmentsListQuery(
    {
      all: true,
      type: 'External',
      parentCompanyId,
    },
    {
      enabled: gates.view && id.length > 0 && parentCompanyId.length > 0,
      scope: `inquire-topics-external:${parentCompanyId}`,
    },
  );

  const [topics, setTopics] = useState<ServiceSchedulingTopic[]>([emptyTopic(0)]);

  const title = detail?.name?.trim() || detail?.url?.trim() || id.slice(0, 8);
  const shortId = id.slice(0, 8);
  const topicsConfigured = Boolean(
    detail?.visitorTopicsConfigured ||
      (topicsQuery.data?.topics?.length ?? 0) > 0 ||
      topics.some((t) => t.clientLabel.trim() || t.routingKey.trim()),
  );

  useEffect(() => {
    if (topicsQuery.isSuccess) {
      setTopics(topicsBundleToDraft(topicsQuery.data));
    }
  }, [topicsQuery.isSuccess, topicsQuery.data]);

  const rosterDeptIds = useMemo(() => {
    const rows = detail?.departmentRoster ?? [];
    return new Set(
      rows.map((d) => d.departmentId.trim()).filter(Boolean),
    );
  }, [detail?.departmentRoster]);

  const internalOptions = useMemo(() => {
    const opts = mapDeptOptions(internalDeptsQuery.data);
    if (rosterDeptIds.size === 0) return opts;
    const scoped = opts.filter((o) => rosterDeptIds.has(o.value));
    return scoped.length > 0 ? scoped : opts;
  }, [internalDeptsQuery.data, rosterDeptIds]);

  const externalOptions = useMemo(() => {
    const opts = mapDeptOptions(externalDeptsQuery.data);
    if (rosterDeptIds.size === 0) return opts;
    const scoped = opts.filter((o) => rosterDeptIds.has(o.value));
    return scoped.length > 0 ? scoped : opts;
  }, [externalDeptsQuery.data, rosterDeptIds]);

  /** Visitor topic department select — External catalog (parent-scoped), searchable. */
  const departmentSelectOptions = useMemo(() => {
    const opts = externalOptions.map((o) => ({
      value: o.value,
      label: o.label,
    }));
    return [{ value: '', label: 'Select department…' }, ...opts];
  }, [externalOptions]);

  const updateTopic = (index: number, patch: Partial<ServiceSchedulingTopic>) => {
    setTopics((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, ...patch };
        if (patch.clientLabel != null && !t.routingKey.trim()) {
          next.routingKey = slugRoutingKey(patch.clientLabel);
        }
        return next;
      }),
    );
  };

  const addTopic = () => {
    setTopics((prev) => [...prev, emptyTopic(prev.length)]);
  };

  const removeTopic = (index: number) => {
    setTopics((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [emptyTopic(0)];
    });
  };

  const onSave = async () => {
    const err = validateVisitorTopicsDraft(topics);
    if (err) {
      Alert.alert('Validation', err);
      return;
    }
    try {
      await saveMutation.mutateAsync(buildVisitorTopicsSaveBody(topics));
      Alert.alert('Saved', 'Inquire topics updated.');
      void detailQuery.refetch();
      void topicsQuery.refetch();
    } catch (e) {
      Alert.alert('Save failed', extractApiErrorMessage(e));
    }
  };

  if (!gates.view) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to manage inquire topics.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  const loading = detailQuery.isLoading || topicsQuery.isLoading;

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
       showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.push('/website-assigning/inquire-topics' as Href)}
            style={({ pressed }) => [
              styles.backBtn,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
          >
            <Typography variant="small" style={{ fontWeight: '600' }}>
              ← All inquire topics
            </Typography>
          </Pressable>
          <Button
            size="compact"
            variant="outlined"
            onPress={() =>
              router.push(
                `/website-assigning/website/${encodeURIComponent(id)}/service-scheduling` as Href,
              )
            }
          >
            Service scheduling
          </Button>
        </View>

        <View style={{ gap: 4 }}>
          <Typography variant="boldLarge">Inquire topics</Typography>
          <Typography variant="medium" muted>
            Configure which visitor topics route to departments for this website.
          </Typography>
        </View>

        <View
          style={[
            styles.siteCard,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View
            style={[
              styles.siteIcon,
              { backgroundColor: `${accent}22`, borderColor: glassUi.border.subtle },
            ]}
          >
            <Ionicons name="folder-outline" size={18} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="medium16" style={{ fontWeight: '700' }} numberOfLines={1}>
              {shortId}
            </Typography>
            <Typography variant="small" muted numberOfLines={2}>
              @ {detail?.url?.trim() || title}
            </Typography>
            <View
              style={[
                styles.statusChip,
                {
                  backgroundColor: topicsConfigured
                    ? 'rgba(34,197,94,0.16)'
                    : 'rgba(245,158,11,0.16)',
                  borderColor: topicsConfigured
                    ? 'rgba(34,197,94,0.4)'
                    : 'rgba(245,158,11,0.4)',
                },
              ]}
            >
              <Typography
                variant="small"
                style={{
                  fontWeight: '700',
                  color: topicsConfigured ? '#4ade80' : '#fbbf24',
                }}
              >
                {topicsConfigured ? 'Topics configured' : 'Please add topics'}
              </Typography>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={accent} />
        ) : topicsQuery.isError ? (
          <AppCard>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(topicsQuery.error, 'Could not load visitor topics.')}
            </Typography>
          </AppCard>
        ) : (
          <View
            style={[
              styles.topicsShell,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <Typography variant="medium16" style={{ fontWeight: '800' }}>
              Visitor topics
            </Typography>
            <Typography variant="small" muted>
              Optional inquire topics for external visitor routing. Internal chats use department
              assignments only — topics are not required for internal or team assignment.
            </Typography>

            <View
              style={[
                styles.deptCatalog,
                {
                  borderColor: theme.app.dashboard.cardBorder,
                  backgroundColor: 'rgba(255,255,255,0.03)',
                },
              ]}
            >
              <Typography variant="small" muted style={{ fontWeight: '700' }}>
                Available departments (client catalog)
              </Typography>
              <Typography variant="small" style={{ fontWeight: '700' }}>
                Internal ({internalOptions.length})
              </Typography>
              <View style={styles.chipRow}>
                {internalOptions.length === 0 ? (
                  <Typography variant="small" muted>
                    {internalDeptsQuery.isLoading ? 'Loading…' : 'No internal departments'}
                  </Typography>
                ) : (
                  internalOptions.map((d) => (
                    <View
                      key={`int-${d.value}`}
                      style={[
                        styles.deptChip,
                        { borderColor: glassUi.border.subtle },
                      ]}
                    >
                      <Typography variant="small" numberOfLines={1}>
                        {d.label}
                      </Typography>
                    </View>
                  ))
                )}
              </View>
              <Typography variant="small" style={{ fontWeight: '700' }}>
                External ({externalOptions.length})
              </Typography>
              <View style={styles.chipRow}>
                {externalOptions.length === 0 ? (
                  <Typography variant="small" muted>
                    {externalDeptsQuery.isLoading
                      ? 'Loading…'
                      : parentCompanyId
                        ? 'No external departments'
                        : 'Waiting for parent company…'}
                  </Typography>
                ) : (
                  externalOptions.map((d) => (
                    <View
                      key={`ext-${d.value}`}
                      style={[
                        styles.deptChip,
                        { borderColor: glassUi.border.subtle },
                      ]}
                    >
                      <Typography variant="small" numberOfLines={1}>
                        {d.label}
                      </Typography>
                    </View>
                  ))
                )}
              </View>
            </View>

            {topics.map((topic, index) => (
              <View
                key={`topic-${index}`}
                style={[
                  styles.topicCard,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  },
                ]}
              >
                <View style={styles.rowBetween}>
                  <Typography variant="medium16" style={{ fontWeight: '700' }}>
                    Topic {index + 1}
                  </Typography>
                  {canEdit && topics.length > 1 ? (
                    <Button size="compact" variant="ghost" onPress={() => removeTopic(index)}>
                      Remove
                    </Button>
                  ) : null}
                </View>
                <InputField
                  label="Routing key"
                  value={topic.routingKey}
                  onChangeText={(v) => updateTopic(index, { routingKey: v })}
                  editable={canEdit}
                  placeholder="billing"
 />
                <InputField
                  label="Client label (widget)"
                  value={topic.clientLabel}
                  onChangeText={(v) => updateTopic(index, { clientLabel: v })}
                  editable={canEdit}
                  placeholder="Billing"
 />
                <SelectField
                  label="Department"
                  value={topic.externalDepartmentId}
                  onChange={(v) => updateTopic(index, { externalDepartmentId: v })}
                  options={departmentSelectOptions}
                  disabled={!canEdit || externalDeptsQuery.isLoading}
                  searchable
                  searchPlaceholder="Filter departments…"
                  placeholder="Select department…"
                  helperText={
                    !parentCompanyId
                      ? 'Loading parent company for external departments…'
                      : externalOptions.length === 0 && !externalDeptsQuery.isLoading
                        ? 'No external departments for this parent company.'
                        : undefined
                  }
 />
                <Checkbox
                  checked={topic.isActive !== false}
                  disabled={!canEdit}
                  label="Active"
                  onChange={(next) => updateTopic(index, { isActive: next })}
 />
              </View>
            ))}

            {canEdit ? (
              <Button variant="outlined" onPress={addTopic}>
                + Add topic
              </Button>
            ) : null}
          </View>
        )}

        {canEdit ? (
          <View
            style={[
              styles.saveBar,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
              <Typography variant="medium" style={{ fontWeight: '700' }}>
                Save inquire topics
              </Typography>
              <Typography variant="small" muted>
                Topics are required before agent roster assignment.
              </Typography>
            </View>
            <Button
              onPress={() => void onSave()}
              disabled={saveMutation.isPending}
              style={styles.saveBtn}
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Inquire topics'}
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 40 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  siteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  siteIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 2,
  },
  topicsShell: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  deptCatalog: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deptChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  topicCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  saveBtn: { minWidth: 160 },
});
