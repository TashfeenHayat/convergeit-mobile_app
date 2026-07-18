import { ScrollView, StyleSheet, View } from 'react-native';
import { apiClient } from '@/api/http/axios-instance';
import { Button, PermissionDeniedPanel, Typography } from '@/components/ui';
import { tokens } from '@/theme/tokens';
import { ApiResourceScreen } from '@/features/shared';
import { listAdminWidgets } from '@/api/widgets';
import { listQaRosterInScope } from '@/services/chat/qa-roster.api';
import { listWebsiteDirectory } from '@/api/companies/companies.api';
import { listWebsitesInScope } from '@/api/website-assignments/website-assignments.api';
import {
  ChatLivePageHeader,
  ChatLivePageShell,
} from '@/features/chat-shared';
import { useAuth } from '@/lib/auth';
import { useChatApiGates } from '@/lib/permissions/use-chat-api-gates';
import { useChatReports } from '@/features/chat-reports/hooks/useChatReports';
import { ReportBucketTable } from '@/features/chat-reports/components/ReportBucketTable';
import { formatScore } from '@/features/chat-reports/utils/format-metric';
import { chatReportsStyles, KpiCard } from '@/features/chat-reports/styles/chat-reports.styles';
import { ChatQaWorkspace } from '@/features/chat-qa';
export function ChatTranscriptsListPage() {
  return (
    <ApiResourceScreen
      title="Chat transcripts"
      description="Closed and historical conversations."
      icon="chatbubbles-outline"
      queryKey={['chat', 'transcripts']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/transcripts', { params });
        return data;
      }}
      columnIds={['name', 'status', 'websiteName', 'closedAt']}
      emptyTitle="No transcripts"
      emptyDescription="Closed chats will appear here."
    />
  );
}

export function CannedMessagesListPage() {
  return (
    <ApiResourceScreen
      title="Canned messages"
      description="Reusable agent reply shortcuts."
      icon="chatbubbles-outline"
      queryKey={['chat', 'canned']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/canned-responses', { params });
        return data;
      }}
      columnIds={['title', 'shortcut', 'body']}
      createLabel="Add"
      createFields={[
        { key: 'title', label: 'Title', required: true },
        { key: 'shortcut', label: 'Shortcut', placeholder: '/hello' },
        { key: 'body', label: 'Message body', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/chat/canned-responses', body);
        return data;
      }}
    />
  );
}

export function ChatSettingsListPage() {
  return (
    <ApiResourceScreen
      title="Chat settings"
      description="Per-website live chat configuration."
      icon="settings-outline"
      queryKey={['chat', 'settings']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/settings', { params });
        return data;
      }}
      columnIds={['name', 'websiteId', 'status']}
    />
  );
}

export function QaInboxListPage() {
  return <ChatQaWorkspace />;
}

export function QaRosterListPage() {
  return (
    <ApiResourceScreen
      title="QA roster"
      description="QA reviewers assigned by website and channel."
      icon="shield-outline"
      queryKey={['chat', 'qa-roster']}
      queryFn={async (params) => {
        const items = await listQaRosterInScope({
          all: true,
          search: params.search,
        });
        return { items, total: items.length, page: 1, limit: items.length };
      }}
      columnIds={['websiteId', 'userId', 'channelScope']}
      emptyTitle="No QA roster entries"
      emptyDescription="Assign QA reviewers from chat settings or the web dashboard."
    />
  );
}

export function QaTeamQualityPage() {
  const { permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const allowed = gates.reports;
  const reports = useChatReports({ apiEnabled: allowed });

  if (permissionsSyncing) {
    return (
      <View style={qaTeamQualityStyles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </View>
    );
  }

  if (!allowed) {
    return (
      <View style={qaTeamQualityStyles.center}>
        <PermissionDeniedPanel
          title="Team QA reports not available"
          description="Requires chat report access from /auth/me."
        />
      </View>
    );
  }

  const qaQuality = reports.qaQuality;
  const summary = qaQuality?.summary;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <ChatLivePageShell>
        <ChatLivePageHeader
          title="Team QA reports"
          subtitle="QA performance by agent for your monitored chat scope."
          navPreset="triage"
        />
        <View style={qaTeamQualityStyles.toolbar}>
          <Button variant="secondary" size="compact" onPress={() => void reports.refresh()}>
            Refresh
          </Button>
        </View>

        {reports.qaQualityLoading ? (
          <Typography variant="small" muted style={{ padding: tokens.space.lg }}>
            Loading team QA report…
          </Typography>
        ) : qaQuality ? (
          <>
            <View style={[chatReportsStyles.kpiGrid, { padding: tokens.space.md }]}>
              <KpiCard label="Completed reviews" value={String(summary?.completedReviews ?? 0)} />
              <KpiCard label="Avg QA score" value={formatScore(summary?.avgQaScore)} />
              <KpiCard label="Slow-reply chats" value={String(summary?.slowReplyChatCount ?? 0)} />
            </View>
            <View style={{ padding: tokens.space.md }}>
              <ReportBucketTable
                title="By agent"
                rows={(qaQuality.byAgent ?? []).map((row) => ({
                  label: row.label,
                  conversationCount: row.reviewCount,
                  avgQaScore: row.avgScore,
                }))}
                emptyLabel="No agent QA data in this range."
              />
            </View>
          </>
        ) : (
          <Typography variant="small" style={{ color: tokens.colors.danger, padding: tokens.space.lg }}>
            Could not load team QA report. Check date range and permissions.
          </Typography>
        )}
      </ChatLivePageShell>
    </ScrollView>
  );
}

const qaTeamQualityStyles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: tokens.space.lg },
  toolbar: { paddingHorizontal: tokens.space.md, paddingBottom: tokens.space.sm },
});
export function ChatInvolvementListPage() {
  return (
    <ApiResourceScreen
      title="Chat involvement"
      description="Supervisors involved in live conversations."
      icon="people-outline"
      queryKey={['chat', 'involvement']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/involvement', { params });
        return data;
      }}
      columnIds={['name', 'email', 'role']}
    />
  );
}

export function ChatInternalSupervisorsListPage() {
  return (
    <ApiResourceScreen
      title="Internal supervisors"
      description="Internal supervisor assignments for chat."
      icon="shield-outline"
      queryKey={['chat', 'internal-supervisors']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/internal-supervisors', { params });
        return data;
      }}
      columnIds={['name', 'email']}
    />
  );
}

export function ChatReportsPage() {
  return (
    <ApiResourceScreen
      title="Chat reports"
      description="Operational chat metrics and report rows."
      icon="list-outline"
      queryKey={['chat', 'reports']}
      queryFn={async (params) => {
        const { data } = await apiClient.get('/chat/reports', { params });
        return data;
      }}
      columnIds={['name', 'metric', 'value', 'period']}
    />
  );
}

export function ChatWidgetListPage() {
  return (
    <ApiResourceScreen
      title="Chat widgets"
      description="Embeddable visitor chat widgets."
      icon="globe-outline"
      queryKey={['widgets']}
      queryFn={async (params) => listAdminWidgets(params)}
      columnIds={['name', 'widgetKey', 'widgetTypeLabel', 'status']}
      createLabel="Add"
      createFields={[
        { key: 'name', label: 'Widget name', required: true },
        { key: 'websiteId', label: 'Website ID', required: true },
      ]}
      createFn={async (body) => {
        const { data } = await apiClient.post('/widgets', body);
        return data;
      }}
    />
  );
}
