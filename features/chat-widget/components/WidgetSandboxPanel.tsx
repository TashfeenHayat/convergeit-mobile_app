import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Button, Typography } from '@/components/ui';
import { WidgetSandboxActionButton } from '@/features/chat-widget/components/WidgetSandboxActionButton';
import { useWidgetPreviewShareLink } from '@/features/chat-widget/hooks/useWidgetPreviewShareLink';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { resolveWidgetEmbedAppOrigin } from '@/lib/chat-widget/widget-embed-api-origin';
import { buildWidgetPublicTestPageUrl } from '@/lib/chat-widget/widget-sandbox-url';
import {
  getWidgetPublicPreviewRuntimeConfig,
  postWidgetSession,
} from '@/lib/widget-runtime/widget-public-fetch';
import { useAppTheme } from '@/theme';

export type WidgetSandboxPanelProps = {
  widgetKey: string;
  title?: string;
  refreshKey?: number;
  onRefresh?: () => void;
};

/**
 * Test sandbox — GET preview-share-link on mount, then
 * GET /widget/preview-config/:key?token=… + POST /widget/session (web iframe parity).
 */
export function WidgetSandboxPanel({
  widgetKey,
  title = 'Visitor widget',
  refreshKey = 0,
  onRefresh,
}: WidgetSandboxPanelProps) {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const key = widgetKey.trim();
  const share = useWidgetPreviewShareLink(key);
  const { refresh: refreshShare, data: shareData, previewShareToken } = share;
  const [warming, setWarming] = useState(false);
  const [warmError, setWarmError] = useState<string | null>(null);
  const [linkBusy, setLinkBusy] = useState<'open' | 'copy' | null>(null);

  const publicTestUrl =
    share.publicTestUrl ||
    (previewShareToken
      ? buildWidgetPublicTestPageUrl({
          widgetKey: key,
          previewShareToken,
          appOrigin: resolveWidgetEmbedAppOrigin(),
        })
      : '');

  const warmPreviewRuntime = useCallback(async () => {
    if (!key.startsWith('wgt_')) return;
    setWarming(true);
    setWarmError(null);
    try {
      const link = (await refreshShare()) ?? shareData;
      const token = link?.previewShareToken?.trim() || '';
      if (!token) {
        setWarmError('Preview token unavailable.');
        return;
      }
      /** GET /widget/preview-config/:key?token=… */
      const cfg = await getWidgetPublicPreviewRuntimeConfig(key, token);
      if (!cfg.ok) {
        setWarmError(cfg.message || 'Failed to load preview config.');
        return;
      }
      let originHost = 'app.convergeit.app';
      try {
        const origin = resolveWidgetEmbedAppOrigin();
        if (origin) originHost = new URL(origin).host;
      } catch {
        /* keep default */
      }
      /** POST /widget/session */
      const session = await postWidgetSession({
        widgetKey: key,
        previewShareToken: token,
        originHost,
      });
      if (!session.ok) {
        setWarmError(session.message || 'Failed to start widget session.');
      }
    } catch (err) {
      setWarmError(
        extractApiErrorMessage(err, 'Could not warm sandbox preview.'),
      );
    } finally {
      setWarming(false);
    }
  }, [key, refreshShare, shareData]);

  useEffect(() => {
    void warmPreviewRuntime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, refreshKey]);

  const openTestPage = async () => {
    setLinkBusy('open');
    try {
      const link = shareData ?? (await refreshShare());
      const url =
        link?.publicTestUrl?.trim() ||
        (link?.previewShareToken
          ? buildWidgetPublicTestPageUrl({
              widgetKey: key,
              previewShareToken: link.previewShareToken,
              appOrigin: resolveWidgetEmbedAppOrigin(),
            })
          : publicTestUrl);
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
    setLinkBusy('copy');
    try {
      const link = shareData ?? (await refreshShare());
      const url =
        link?.publicTestUrl?.trim() ||
        (link?.previewShareToken
          ? buildWidgetPublicTestPageUrl({
              widgetKey: key,
              previewShareToken: link.previewShareToken,
              appOrigin: resolveWidgetEmbedAppOrigin(),
            })
          : publicTestUrl);
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

  const handleRefresh = () => {
    onRefresh?.();
    void warmPreviewRuntime();
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.titleRow}>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              {title}
            </Typography>
            <View
              style={[
                styles.chip,
                {
                  backgroundColor: `${accent}22`,
                  borderColor: `${accent}55`,
                },
              ]}
            >
              <Typography
                variant="small"
                style={{ color: accent, fontWeight: '600' }}
              >
                Sandbox
              </Typography>
            </View>
          </View>
          <Typography variant="small" muted>
            Latest saved draft. Refresh after saving. Share the public link so
            anyone can test without logging in.
          </Typography>
        </View>
        {onRefresh ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh sandbox"
            onPress={handleRefresh}
            style={({ pressed }) => [
              styles.refreshBtn,
              {
                borderColor: theme.app.dashboard.cardBorder,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="refresh" size={18} color={theme.app.text.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="compact"
          loading={linkBusy === 'open'}
          disabled={linkBusy !== null}
          onPress={() => void openTestPage()}
        >
          Open test page
        </Button>
        <Button
          variant="outlined"
          size="compact"
          loading={linkBusy === 'copy'}
          disabled={linkBusy !== null}
          onPress={() => void copyPublicLink()}
        >
          Copy public link
        </Button>
      </View>

      <View
        style={[
          styles.phone,
          { borderColor: 'rgba(255,255,255,0.12)' },
        ]}
      >
        <View style={styles.notchBar}>
          <View style={styles.notch} />
        </View>
        <View style={styles.phoneBody}>
          {share.loading || warming ? (
            <ActivityIndicator color={accent} />
          ) : warmError || share.error ? (
            <Typography variant="small" muted style={{ textAlign: 'center' }}>
              {warmError || share.error}
              {'\n'}Use Open test page to preview in the browser.
            </Typography>
          ) : (
            <>
              <Typography variant="small" muted style={{ textAlign: 'center' }}>
                Preview session ready. Open the test page to interact with the
                visitor widget.
              </Typography>
              <WidgetSandboxActionButton widgetKey={key} variant="button" />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 8 },
  phone: {
    borderRadius: 28,
    borderWidth: 10,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    minHeight: 320,
  },
  notchBar: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  notch: {
    width: 64,
    height: 5,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  phoneBody: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
});
