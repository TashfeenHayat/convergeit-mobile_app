import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import type { JsonRecord } from '@/api/types/common.types';
import {
  deleteWidget,
  getAdminWidget,
  getWidgetEmbedSnippet,
  getWidgetSnapshot,
  widgetResponseData,
} from '@/api/widgets/widgets.api';
import { MobileScreen } from '@/components/layout';
import {
  AppCard,
  Button,
  PermissionDeniedPanel,
  Typography,
} from '@/components/ui';
import { WidgetDeployStatusCard } from '@/features/chat-widget/components/WidgetDeployStatusCard';
import { WidgetSandboxPanel } from '@/features/chat-widget/components/WidgetSandboxPanel';
import { WidgetSnapshotPreview } from '@/features/chat-widget/components/WidgetSnapshotPreview';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import { parseSnapshotForPreview } from '@/lib/chat-widget/snapshot-preview-model';
import {
  normalizeEmbedSnippetForApi,
  resolveWidgetEmbedAppOrigin,
} from '@/lib/chat-widget/widget-embed-api-origin';
import {
  pickEmbedAppOrigin,
  pickEmbedSessionExpiresIn,
  readEmbedSnippetMarkup,
} from '@/lib/chat-widget/widget-install-response';
import { buildUnifiedWidgetEmbedScript } from '@/lib/chat-widget/widgetDraft';
import { OP } from '@/lib/permissions/operational-keys';
import { useChatApiGates } from '@/lib/permissions/use-chat-api-gates';
import { useThemeColors } from '@/lib/theme/use-theme-colors';
import { isRecord } from '@/lib/utils';
import { useAppTheme } from '@/theme';

export type ChatWidgetDetailVariant = 'view' | 'manage';

type SummaryRow = { label: string; value: string };

function formatIsoDate(value: unknown): string {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

function deployStateLabel(state: unknown): string {
  const s = String(state ?? '');
  if (s === 'live') return 'Live';
  if (s === 'live_with_pending_draft') return 'Live (unsaved draft)';
  if (s === 'draft_only') return 'Draft only';
  return s || '—';
}

function formatWidgetAdminSummary(admin: JsonRecord): SummaryRow[] {
  const website = isRecord(admin.website) ? admin.website : undefined;
  const deploy = isRecord(admin.deploy) ? admin.deploy : undefined;
  const surfaces = Array.isArray(admin.surfaces)
    ? (admin.surfaces as string[]).join(', ')
    : '';
  const domains = Array.isArray(admin.allowedDomains)
    ? (admin.allowedDomains as string[]).join(', ')
    : '';

  return [
    {
      label: 'Website',
      value: String(website?.name ?? website?.url ?? '—'),
    },
    {
      label: 'Website URL',
      value: String(website?.url ?? '—'),
    },
    {
      label: 'Widget type',
      value: String(admin.widgetType ?? '—'),
    },
    ...(surfaces ? [{ label: 'Surfaces', value: surfaces }] : []),
    {
      label: 'Status',
      value: deployStateLabel(deploy?.state),
    },
    {
      label: 'Published',
      value: formatIsoDate(deploy?.liveAt),
    },
    {
      label: 'Last saved',
      value: formatIsoDate(deploy?.draftSavedAt),
    },
    {
      label: 'Allowed domains',
      value: admin.embedAllowAnyOrigin
        ? 'Any website (embed unrestricted)'
        : domains || 'None configured',
    },
  ];
}

/**
 * Widget details — parity with web dashboard.
 * Load: GET widget + snapshot → embed-snippet; deploy card GET widget again;
 * sandbox: preview-share-link → preview-config + session.
 */
export function ChatWidgetDetailClient({
  widgetKey,
  variant = 'view',
}: {
  widgetKey: string;
  variant?: ChatWidgetDetailVariant;
}) {
  const theme = useAppTheme();
  const colors = useThemeColors();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { hasOperational, permissionsSyncing } = useAuth();
  const gates = useChatApiGates();
  const canEdit = hasOperational(OP.chatWidget.update);
  const canDelete = hasOperational(OP.chatWidget.delete);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admin, setAdmin] = useState<JsonRecord | null>(null);
  const [snapshot, setSnapshot] = useState<JsonRecord | null>(null);
  const [snippetHtml, setSnippetHtml] = useState<string | null>(null);
  const [snippetEmbedOrigin, setSnippetEmbedOrigin] = useState('');
  const [sessionExpiresIn, setSessionExpiresIn] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);

  const embedAppOrigin = useMemo(
    () =>
      resolveWidgetEmbedAppOrigin({
        apiEmbedAppOrigin: snippetEmbedOrigin,
      }),
    [snippetEmbedOrigin],
  );

  const load = useCallback(async () => {
    if (!widgetKey.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [adminRes, snapRes] = await Promise.all([
        getAdminWidget(widgetKey),
        getWidgetSnapshot(widgetKey),
      ]);
      setAdmin(widgetResponseData<JsonRecord>(adminRes));
      setSnapshot(widgetResponseData<JsonRecord>(snapRes));

      let html: string | null = null;
      let ttl = '';
      try {
        const snippetRes = await getWidgetEmbedSnippet(widgetKey);
        html = readEmbedSnippetMarkup(snippetRes);
        ttl = pickEmbedSessionExpiresIn(snippetRes);
        setSnippetEmbedOrigin(pickEmbedAppOrigin(snippetRes));
      } catch {
        setSnippetEmbedOrigin('');
      }
      setSessionExpiresIn(ttl);
      setSnippetHtml(html);
    } catch (e) {
      setError(extractApiErrorMessage(e, 'Failed to load widget.'));
      setAdmin(null);
      setSnapshot(null);
      setSessionExpiresIn('');
      setSnippetHtml(null);
      setSnippetEmbedOrigin('');
    } finally {
      setLoading(false);
    }
  }, [widgetKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const adminSummary = useMemo(
    () => (admin ? formatWidgetAdminSummary(admin) : []),
    [admin],
  );

  const snapshotPreview = useMemo(
    () => parseSnapshotForPreview(snapshot),
    [snapshot],
  );

  const displayEmbedSnippet = useMemo(() => {
    if (!widgetKey.trim()) return '';
    const raw =
      snippetHtml?.trim() ||
      buildUnifiedWidgetEmbedScript({
        widgetKey,
        appOrigin: embedAppOrigin,
      });
    return normalizeEmbedSnippetForApi(raw, embedAppOrigin);
  }, [snippetHtml, widgetKey, embedAppOrigin]);

  const handleCopySnippet = async () => {
    const text = displayEmbedSnippet.trim();
    if (!text) {
      Alert.alert(
        'Embed',
        'No embed snippet available. Publish the widget first.',
      );
      return;
    }
    setCopyBusy(true);
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Embed snippet copied.');
    } catch {
      Alert.alert('Copy', 'Could not copy to clipboard.');
    } finally {
      setCopyBusy(false);
    }
  };

  const handleDeleteWidget = () => {
    Alert.alert(
      'Delete this widget?',
      'This removes the widget configuration from your account. Your website record is not deleted.\n\n' +
        widgetKey,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeleting(true);
              try {
                await deleteWidget(widgetKey);
                router.replace('/(dashboard)/chat-widget' as Href);
              } catch (e) {
                Alert.alert(
                  'Delete failed',
                  extractApiErrorMessage(e, 'Delete failed.'),
                );
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  const title = variant === 'manage' ? 'Manage widget' : 'Widget details';

  if (permissionsSyncing) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <Typography variant="medium" muted>
          Loading permissions…
        </Typography>
      </MobileScreen>
    );
  }

  if (!gates.widgetSettings) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <PermissionDeniedPanel
          title="Widget not available"
          description="Requires chat-widget permissions."
 />
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() =>
              router.push('/(dashboard)/chat-widget' as Href)
            }
            style={({ pressed }) => [
              styles.backBtn,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={theme.app.text.primary}
 />
            <Typography variant="small" style={{ fontWeight: '600' }}>
              All widgets
            </Typography>
          </Pressable>
          <View
            style={[
              styles.keyChip,
              {
                borderColor: theme.app.dashboard.cardBorder,
                backgroundColor: theme.app.dashboard.overlayLight,
              },
            ]}
          >
            <Typography
              variant="small"
              muted
              style={{ fontFamily: 'monospace' }}
            >
              {widgetKey}
            </Typography>
          </View>
        </View>

        <View style={styles.titleRow}>
          <Typography
            variant="regularLarge"
            numberOfLines={1}
            style={styles.titleText}
          >
            {title}
          </Typography>
          {variant === 'view' ? (
            <View style={styles.headerActions}>
              {canEdit ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit configuration"
                  hitSlop={8}
                  onPress={() =>
                    router.push(
                      `/(dashboard)/chat-widget/${encodeURIComponent(widgetKey)}/edit` as Href,
                    )
                  }
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color={
                      colors.isLight ? colors.accentPurple : '#E9D5FF'
                    }
 />
                </Pressable>
              ) : null}
              {canDelete ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete widget"
                  hitSlop={8}
                  disabled={deleting}
                  onPress={handleDeleteWidget}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { opacity: deleting || pressed ? 0.7 : 1 },
                  ]}
                >
                  {deleting ? (
                    <ActivityIndicator
                      size="small"
                      color={
                        colors.isLight ? colors.accentRed : '#FCA5A5'
                      }
 />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={
                        colors.isLight ? colors.accentRed : '#FCA5A5'
                      }
 />
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>

        {!loading && !error && widgetKey.trim() ? (
          <WidgetDeployStatusCard widgetKey={widgetKey} />
        ) : null}

        {error ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {error}
            </Typography>
            <Button variant="primary" onPress={() => void load()}>
              Retry
            </Button>
          </AppCard>
        ) : null}

        {loading ? (
          <ActivityIndicator color={accent} style={{ marginVertical: 24 }} />
        ) : null}

        {!loading && !error ? (
          <View style={styles.stack}>
            <AppCard style={styles.section}>
              <Typography variant="medium" style={{ fontWeight: '600' }}>
                Widget summary
              </Typography>
              {adminSummary.length === 0 ? (
                <Typography variant="small" muted>
                  No widget details available.
                </Typography>
              ) : (
                <View style={styles.summary}>
                  {adminSummary.map(({ label, value }) => (
                    <View key={label} style={styles.summaryRow}>
                      <Typography
                        variant="small"
                        muted
                        style={styles.summaryLabel}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="small"
                        style={styles.summaryValue}
                      >
                        {value}
                      </Typography>
                    </View>
                  ))}
                </View>
              )}
            </AppCard>

            <AppCard style={styles.section}>
              <Typography variant="medium" style={{ fontWeight: '600' }}>
                Embed code
              </Typography>
              <Typography variant="small" muted>
                Paste this script before the closing {'</body>'} tag on your
                website.
              </Typography>
              {displayEmbedSnippet.trim() ? (
                <View
                  style={[
                    styles.codeBox,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    muted
                    style={styles.codeText}
                  >
                    {displayEmbedSnippet}
                  </Typography>
                </View>
              ) : (
                <Typography variant="small" muted>
                  Publish the widget to generate an embed snippet.
                </Typography>
              )}
              <Button
                variant="primary"
                size="compact"
                loading={copyBusy}
                disabled={!displayEmbedSnippet.trim()}
                onPress={() => void handleCopySnippet()}
              >
                Copy embed snippet
              </Button>
            </AppCard>

            {snapshotPreview?.hasRenderable ? (
              <AppCard style={styles.section}>
                <Typography variant="medium" style={{ fontWeight: '600' }}>
                  Saved design preview
                </Typography>
                <Typography variant="small" muted>
                  Visual preview from your saved configuration (draft or
                  published).
                </Typography>
                <WidgetSnapshotPreview parsed={snapshotPreview} />
              </AppCard>
            ) : null}

            <AppCard style={styles.section}>
              <View style={styles.sandboxHeader}>
                <Typography variant="medium" style={{ fontWeight: '600' }}>
                  Test sandbox
                </Typography>
                {widgetKey.trim() && embedAppOrigin ? (
                  <Pressable
                    onPress={() => setIframeKey((k) => k + 1)}
                    style={({ pressed }) => [
                      styles.refreshBtn,
                      {
                        borderColor: theme.app.dashboard.cardBorder,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name="refresh"
                      size={16}
                      color={theme.app.text.primary}
 />
                    <Typography variant="small">Refresh</Typography>
                  </Pressable>
                ) : null}
              </View>
              <Typography variant="small" muted>
                Try the visitor widget — loads your saved draft. Click Refresh
                after wizard saves.
                {sessionExpiresIn.trim()
                  ? ` Visitor sessions expire after ${sessionExpiresIn.trim()}.`
                  : null}
              </Typography>
              {widgetKey.trim() && embedAppOrigin ? (
                <WidgetSandboxPanel
                  widgetKey={widgetKey}
                  refreshKey={iframeKey}
                  title="Visitor widget"
                  onRefresh={() => setIframeKey((k) => k + 1)}
 />
              ) : (
                <Typography variant="small" muted>
                  Could not resolve embed host for the test sandbox.
                </Typography>
              )}
            </AppCard>
          </View>
        ) : null}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 40, gap: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  topRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  keyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    flex: 1,
    minWidth: 0,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: { gap: 14 },
  section: { gap: 10 },
  summary: { gap: 8 },
  summaryRow: { gap: 2 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 14 },
  codeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  sandboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
});
