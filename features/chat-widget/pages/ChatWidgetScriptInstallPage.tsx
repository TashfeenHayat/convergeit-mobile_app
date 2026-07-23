import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import {
  getWidgetEmbedSnippet,
  getWidgetPreviewShareLink,
  type WidgetPreviewShareLink,
} from '@/api/widgets/widgets.api';
import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { AppCard, Button, Typography } from '@/components/ui';
import { useWidgetAdminLifecycle } from '@/features/chat-widget/hooks/useWidgetAdminLifecycle';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  readChatWizardDraft,
  resolveRemoteWidgetKeyForChatWizard,
  useChatWidgetWizardEdit,
  withChatEditQuery,
} from '@/lib/chat-widget/chat-wizard-edit';
import { resolveWidgetEmbedAppOrigin } from '@/lib/chat-widget/widget-embed-api-origin';
import { readEmbedSnippetMarkup } from '@/lib/chat-widget/widget-install-response';
import {
  patchRemoteWidgetConfiguration,
  resolveWizardKindFromDraft,
} from '@/lib/chat-widget/widget-remote-sync';
import { buildWidgetPublicTestPageUrl } from '@/lib/chat-widget/widget-sandbox-url';
import { useAppTheme } from '@/theme';

const STEPS = [
  { n: '01', label: 'LAUNCHER', hint: 'Button design' },
  { n: '02', label: 'PANEL & TOPICS', hint: 'Chat box' },
  { n: '03', label: 'ALERTS & FORMS', hint: 'Notifications' },
  { n: '04', label: 'PUBLISH & EMBED', hint: 'Install' },
] as const;

const FALLBACK_SNIPPET = `<!-- Converge widget — CDN embed (no secrets in HTML) -->
<script
  src="https://cdn.example.com/widget/embed.js"
  defer
  data-app-origin="https://app.convergeit.app"
  data-api-origin="https://api.convergeit.app"
></script>`;

function resolvePublicTestUrl(
  widgetKey: string,
  link: WidgetPreviewShareLink | null,
): string {
  const fromApi = link?.publicTestUrl?.trim() || '';
  if (fromApi) return fromApi;
  const token = link?.previewShareToken?.trim() || '';
  if (!token) return '';
  return buildWidgetPublicTestPageUrl({
    widgetKey,
    previewShareToken: token,
    appOrigin: resolveWidgetEmbedAppOrigin(),
  });
}

function formatDraftSavedAt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

/**
 * Widget Customization — Step 4 Publish & Embed (Install / Script).
 * Open: PATCH draft + GET embed-snippet + GET widget + GET preview-share-link.
 * Go live: POST publish.
 */
export function ChatWidgetScriptInstallPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { editWidgetKey, draftReady, hydrateError } = useChatWidgetWizardEdit();
  const editKey = editWidgetKey || null;

  const draft = readChatWizardDraft(editKey);
  const widgetKey = resolveRemoteWidgetKeyForChatWizard(editKey, draft);

  const lifecycle = useWidgetAdminLifecycle(widgetKey || undefined);

  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [snippet, setSnippet] = useState('');
  const [shareLink, setShareLink] = useState<WidgetPreviewShareLink | null>(
    null,
  );
  const [linkBusy, setLinkBusy] = useState<'open' | 'copy' | null>(null);
  const [copyScriptBusy, setCopyScriptBusy] = useState(false);

  const loadInstallApis = useCallback(async () => {
    if (!widgetKey) {
      setBootError('Missing widget key.');
      setBooting(false);
      return;
    }
    setBooting(true);
    setBootError(null);
    try {
      const current = readChatWizardDraft(editKey);
      /** PATCH /widgets/:id — final draft sync before embed tools */
      await patchRemoteWidgetConfiguration({
        widgetKey,
        widgetKind: resolveWizardKindFromDraft(current),
        draft: current,
        publishNow: false,
      });

      const [snippetRes, link] = await Promise.all([
        getWidgetEmbedSnippet(widgetKey),
        getWidgetPreviewShareLink(widgetKey),
        lifecycle.refresh(),
      ]);

      const markup = readEmbedSnippetMarkup(snippetRes)?.trim();
      setSnippet(markup || FALLBACK_SNIPPET);
      setShareLink(link);
    } catch (err) {
      setBootError(
        extractApiErrorMessage(err, 'Failed to load install tools.'),
      );
    } finally {
      setBooting(false);
    }
  }, [editKey, lifecycle, widgetKey]);

  useEffect(() => {
    if (!draftReady) return;
    void loadInstallApis();
    // intentionally once draft is ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftReady, widgetKey]);

  const publicTestUrl = resolvePublicTestUrl(widgetKey, shareLink);
  const isLive = lifecycle.isLive;
  const statusLabel =
    lifecycle.statusLabel || (isLive ? 'Live' : 'Offline');
  const draftSavedLabel = formatDraftSavedAt(
    lifecycle.meta?.deploy.draftSavedAt ||
      lifecycle.meta?.updatedAt ||
      null,
  );

  const openTestPage = async () => {
    if (!widgetKey) return;
    setLinkBusy('open');
    try {
      const link = shareLink ?? (await getWidgetPreviewShareLink(widgetKey));
      setShareLink(link);
      const url = resolvePublicTestUrl(widgetKey, link);
      if (!url) {
        Alert.alert('Test link', 'Could not open test link.');
        return;
      }
      const can = await Linking.canOpenURL(url);
      if (!can) {
        Alert.alert('Test link', url);
        return;
      }
      await Linking.openURL(url);
    } catch (err) {
      Alert.alert(
        'Test link',
        extractApiErrorMessage(err, 'Could not open test link.'),
      );
    } finally {
      setLinkBusy(null);
    }
  };

  const copyPublicLink = async () => {
    if (!widgetKey) return;
    setLinkBusy('copy');
    try {
      const link = shareLink ?? (await getWidgetPreviewShareLink(widgetKey));
      setShareLink(link);
      const url = resolvePublicTestUrl(widgetKey, link);
      if (!url) {
        Alert.alert('Copy', 'Test link not ready yet.');
        return;
      }
      await Clipboard.setStringAsync(url);
      Alert.alert('Copied', 'Public test link copied — share with anyone.');
    } catch (err) {
      Alert.alert(
        'Copy',
        extractApiErrorMessage(err, 'Could not copy link.'),
      );
    } finally {
      setLinkBusy(null);
    }
  };

  const copyLiveScript = async () => {
    const text = snippet.trim();
    if (!text) {
      Alert.alert('Copy', 'Embed script not loaded yet.');
      return;
    }
    setCopyScriptBusy(true);
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Live embed script copied to clipboard.');
    } catch (err) {
      Alert.alert(
        'Copy',
        extractApiErrorMessage(err, 'Could not copy script.'),
      );
    } finally {
      setCopyScriptBusy(false);
    }
  };

  if (!draftReady || booting || lifecycle.loading) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            Loading install tools…
          </Typography>
        </View>
      </MobileScreen>
    );
  }

  if (hydrateError || bootError || !widgetKey) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <Typography variant="medium" color={theme.app.danger}>
            {hydrateError || bootError || 'Missing widget key.'}
          </Typography>
          <Button
            size="compact"
            variant="secondary"
            style={{ marginTop: 12 }}
            onPress={() => void loadInstallApis()}
          >
            Retry
          </Button>
        </View>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.push('/(dashboard)/chat-widget' as Href)}
          style={styles.backRow}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={accent} />
          <Typography
            variant="small"
            color={accent}
            style={{ fontWeight: '700' }}
          >
            Back to widget list
          </Typography>
        </Pressable>

        <DashboardPageIntro subtitle="Publish your draft and embed the live script on customer sites." />

        <Typography variant="small" muted>
          Step 4 of 4 — Draft saves on each Next — full publish on Install
          (final step)
        </Typography>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: accent, width: '100%' },
            ]}
 />
        </View>
        <Typography variant="small" muted>
          100% complete
        </Typography>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepRow} showsVerticalScrollIndicator={false}>
          {STEPS.map((step, i) => {
            const active = i === 3;
            const done = i < 3;
            return (
              <View
                key={step.n}
                style={[
                  styles.stepCard,
                  {
                    borderColor: active
                      ? accent
                      : theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                  },
                ]}
              >
                <Typography
                  variant="small"
                  color={active || done ? accent : theme.app.text.muted}
                  style={{ fontWeight: '800' }}
                >
                  {done ? '✓ ' : ''}
                  {step.n} {step.label}
                </Typography>
                <Typography variant="small" muted>
                  {step.hint}
                </Typography>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.infoBox,
            { borderColor: `${accent}66`, backgroundColor: `${accent}14` },
          ]}
        >
          <Typography variant="small">
            Working draft — each step saves with PATCH. Real sites show the
            widget only after you click Go live. Use the test link to preview
            anytime.
          </Typography>
        </View>

        <AppCard style={{ gap: theme.spacing.md }}>
          <Typography variant="medium" style={{ fontWeight: '800' }}>
            Install & embed code
          </Typography>

          <View
            style={[
              styles.warnBox,
              { borderColor: '#FBBF2466', backgroundColor: '#FBBF2418' },
            ]}
          >
            <Typography variant="small" style={{ color: '#FDE68A' }}>
              Widget is offline on real sites until you click Go live. This
              test link always shows your latest saved draft.
            </Typography>
          </View>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Live on customer sites
          </Typography>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  borderColor: isLive ? '#22C55E66' : '#FB923C66',
                  backgroundColor: isLive ? '#22C55E18' : '#FB923C18',
                },
              ]}
            >
              <Typography
                variant="small"
                style={{
                  fontWeight: '800',
                  color: isLive ? '#4ADE80' : '#FB923C',
                }}
              >
                {statusLabel}
              </Typography>
            </View>
            <Typography variant="small" muted style={{ flex: 1 }}>
              Draft saved: {draftSavedLabel}
            </Typography>
          </View>
          <Button
            size="compact"
            loading={lifecycle.busy}
            disabled={lifecycle.busy}
            onPress={() => void lifecycle.publishLatest()}
            style={{ alignSelf: 'flex-start' }}
          >
            {isLive ? 'Publish latest draft' : 'Go live'}
          </Button>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Embed script
          </Typography>
          <Typography variant="small" muted>
            Paste before {`</body>`} on your site after you click Go live.
            While offline, real visitors will not see the widget (test link
            still works).
          </Typography>
          <View
            style={[
              styles.codeBlock,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Typography
              variant="small"
              style={styles.codeText}
              selectable
            >
              {snippet}
            </Typography>
          </View>

          <View style={styles.actionRow}>
            <Button
              size="compact"
              variant="secondary"
              loading={linkBusy === 'open'}
              disabled={Boolean(linkBusy)}
              onPress={() => void openTestPage()}
              style={styles.actionBtn}
            >
              Open test page
            </Button>
            <Button
              size="compact"
              variant="secondary"
              loading={linkBusy === 'copy'}
              disabled={Boolean(linkBusy)}
              onPress={() => void copyPublicLink()}
              style={styles.actionBtn}
            >
              Copy public link
            </Button>
          </View>

          {publicTestUrl ? (
            <Typography variant="small" muted selectable>
              {publicTestUrl}
            </Typography>
          ) : null}

          <Button
            size="compact"
            variant="secondary"
            onPress={() =>
              router.push('/(dashboard)/chat-widget' as Href)
            }
            style={{ alignSelf: 'flex-start' }}
          >
            Go to Widget Dashboard
          </Button>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              loading={linkBusy === 'open'}
              disabled={Boolean(linkBusy)}
              onPress={() => void openTestPage()}
              style={styles.footerBtn}
            >
              Preview Widget
            </Button>
            <Button
              variant="primary"
              size="compact"
              loading={copyScriptBusy}
              disabled={copyScriptBusy}
              onPress={() => void copyLiveScript()}
              style={styles.footerBtn}
            >
              Copy live script
            </Button>
          </View>

          <Button
            size="compact"
            variant="ghost"
            onPress={() =>
              router.push(
                withChatEditQuery(
                  '/(dashboard)/chat-widget/add/chat/notifications',
                  editKey,
                ) as Href,
              )
            }
          >
            Back to Alerts & Forms
          </Button>
        </AppCard>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 40 },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.25)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
  stepRow: { gap: 8, paddingVertical: 4 },
  stepCard: {
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  infoBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  warnBox: { borderWidth: 1, borderRadius: 12, padding: 12 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeBlock: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#0B1220',
  },
  codeText: {
    color: '#E2E8F0',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flexGrow: 1, minWidth: 140 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  footerBtn: { flex: 1 },
});
