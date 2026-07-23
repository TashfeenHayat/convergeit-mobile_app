import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppCard, Button, Typography } from '@/components/ui';
import { WidgetDraftStatusBar } from '@/features/chat-widget/components/WidgetDraftStatusBar';
import { useWidgetAdminLifecycle } from '@/features/chat-widget/hooks/useWidgetAdminLifecycle';
import { useAppTheme } from '@/theme';

export function WidgetDeployStatusCard({ widgetKey }: { widgetKey: string }) {
  const theme = useAppTheme();
  const {
    meta,
    loading,
    error,
    busy,
    publishLatest,
    unpublishLatest,
    isLive,
  } = useWidgetAdminLifecycle(widgetKey);

  const stateLabel =
    meta?.deploy.state === 'live'
      ? 'Live'
      : meta?.deploy.state === 'live_with_pending_draft'
        ? 'Live · newer draft saved'
        : 'Offline';

  const pillColor = isLive
    ? theme.app.dashboard.accentGreen
    : theme.app.dashboard.accentOrange;

  return (
    <AppCard style={styles.card}>
      <Typography variant="medium" style={{ fontWeight: '700' }}>
        Live on customer sites
      </Typography>

      {loading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : error ? (
        <Typography variant="small" color={theme.app.danger}>
          {error}
        </Typography>
      ) : meta ? (
        <>
          <WidgetDraftStatusBar
            variant="detail"
            deployState={meta.deploy.state}
          />

          <View style={styles.metaRow}>
            <View
              style={[
                styles.pill,
                {
                  borderColor: `${pillColor}59`,
                  backgroundColor: `${pillColor}1F`,
                },
              ]}
            >
              <Typography
                variant="small"
                style={{ fontWeight: '700', color: pillColor }}
              >
                {stateLabel}
              </Typography>
            </View>
            {meta.deploy.draftSavedAt ? (
              <Typography variant="small" muted>
                Draft saved: {new Date(meta.deploy.draftSavedAt).toLocaleString()}
              </Typography>
            ) : null}
            {meta.deploy.liveAt ? (
              <Typography variant="small" muted>
                Last live: {new Date(meta.deploy.liveAt).toLocaleString()}
              </Typography>
            ) : null}
          </View>

          <View style={styles.actions}>
            {meta.deploy.state === 'draft_only' ||
            meta.deploy.state === 'live_with_pending_draft' ? (
              <Button
                variant="primary"
                disabled={busy || loading}
                loading={busy}
                onPress={() => void publishLatest()}
              >
                {meta.deploy.state === 'draft_only'
                  ? 'Go live'
                  : 'Publish changes'}
              </Button>
            ) : null}
            {isLive ? (
              <Button
                variant="outlined"
                disabled={busy || loading}
                onPress={() => void unpublishLatest()}
              >
                Take offline
              </Button>
            ) : null}
          </View>
        </>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  actions: { gap: 8 },
});
