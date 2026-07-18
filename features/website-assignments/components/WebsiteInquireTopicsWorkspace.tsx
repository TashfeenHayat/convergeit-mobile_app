import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
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
import { useAppTheme } from '@/theme';

export type WebsiteInquireTopicsWorkspaceProps = {
  websiteId: string;
};

/** Per-website visitor inquire topics — create / edit / save. */
export function WebsiteInquireTopicsWorkspace({ websiteId }: WebsiteInquireTopicsWorkspaceProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const canEdit = gates.assign;
  const id = websiteId.trim();

  const detailQuery = useWebsiteAssignmentDetailQuery(id, { enabled: gates.view && id.length > 0 });
  const topicsQuery = useVisitorTopicsQuery(id, gates.view && id.length > 0);
  const saveMutation = useSaveVisitorTopicsMutation(id);
  const departmentsQuery = useDepartmentsListQuery(
    { all: true, type: 'External' },
    { enabled: gates.view },
  );

  const [topics, setTopics] = useState<ServiceSchedulingTopic[]>([emptyTopic(0)]);

  const detail = detailQuery.data?.data;
  const title = detail?.name?.trim() || detail?.url?.trim() || id.slice(0, 8);

  useEffect(() => {
    if (topicsQuery.isSuccess) {
      setTopics(topicsBundleToDraft(topicsQuery.data));
    }
  }, [topicsQuery.isSuccess, topicsQuery.data]);

  const departmentOptions = useMemo(() => {
    return pickApiItems(departmentsQuery.data)
      .filter(isRecord)
      .map((r) => {
        const value = pickStr(r, ['id']);
        if (!value) return null;
        return { value, label: pickStr(r, ['name']) || value };
      })
      .filter((x): x is { value: string; label: string } => x !== null);
  }, [departmentsQuery.data]);

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
    <MobileScreen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.md, paddingBottom: 40 }}>
        <Button variant="ghost" size="compact" onPress={() => router.back()}>
          ← Back
        </Button>

        <View>
          <Typography variant="boldLarge">{title}</Typography>
          {detail?.url ? (
            <Typography variant="medium" muted style={{ marginTop: 4 }}>
              {detail.url}
            </Typography>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator color={theme.app.dashboard.accentBlue} />
        ) : topicsQuery.isError ? (
          <AppCard>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(topicsQuery.error, 'Could not load visitor topics.')}
            </Typography>
          </AppCard>
        ) : (
          <>
            {topics.map((topic, index) => (
              <AppCard key={`topic-${index}`} style={{ gap: 10 }}>
                <View style={styles.rowBetween}>
                  <Typography variant="medium16">Topic {index + 1}</Typography>
                  {canEdit && topics.length > 1 ? (
                    <Button size="compact" variant="ghost" onPress={() => removeTopic(index)}>
                      Remove
                    </Button>
                  ) : null}
                </View>
                <InputField
                  label="Client label"
                  value={topic.clientLabel}
                  onChangeText={(v) => updateTopic(index, { clientLabel: v })}
                  editable={canEdit}
                  placeholder="Sales inquiry"
                />
                <InputField
                  label="Routing key"
                  value={topic.routingKey}
                  onChangeText={(v) => updateTopic(index, { routingKey: v })}
                  editable={canEdit}
                  placeholder="sales-inquiry"
                />
                <SelectField
                  label="External department"
                  value={topic.externalDepartmentId}
                  onChange={(v) => updateTopic(index, { externalDepartmentId: v })}
                  options={departmentOptions}
                  disabled={!canEdit}
                />
                <Checkbox
                  checked={topic.isActive !== false}
                  disabled={!canEdit}
                  label="Active"
                  onChange={(next) => updateTopic(index, { isActive: next })}
                />
              </AppCard>
            ))}

            {canEdit ? (
              <View style={{ gap: 8 }}>
                <Button variant="outlined" onPress={addTopic}>
                  Add topic
                </Button>
                <Button onPress={() => void onSave()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving…' : 'Save topics'}
                </Button>
              </View>
            ) : null}
          </>
        )}

        <Button
          variant="outlined"
          onPress={() => router.push(`/website-assigning/website/${id}/service-scheduling` as Href)}
        >
          Service scheduling
        </Button>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
});
