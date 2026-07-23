import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  getWidgetPreviewShareLink,
  type WidgetPreviewShareLink,
} from '@/api/widgets/widgets.api';
import { Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { resolveWidgetEmbedAppOrigin } from '@/lib/chat-widget/widget-embed-api-origin';
import { buildWidgetPublicTestPageUrl } from '@/lib/chat-widget/widget-sandbox-url';

export type WidgetSandboxActionButtonProps = {
  widgetKey: string;
  /** `table` — flask + copy icons (list row). */
  variant?: 'table' | 'button';
};

function resolvePublicTestUrl(
  widgetKey: string,
  link: WidgetPreviewShareLink | null,
): string {
  const key = widgetKey.trim();
  const fromApi = link?.publicTestUrl?.trim() || '';
  if (fromApi) return fromApi;
  const token = link?.previewShareToken?.trim() || '';
  if (!token) return '';
  return buildWidgetPublicTestPageUrl({
    widgetKey: key,
    previewShareToken: token,
    appOrigin: resolveWidgetEmbedAppOrigin(),
  });
}

/**
 * Flask (open public test) + copy — hits GET /widgets/:key/preview-share-link on press only.
 */
export function WidgetSandboxActionButton({
  widgetKey,
  variant = 'table',
}: WidgetSandboxActionButtonProps) {
  const key = widgetKey.trim();
  const [busy, setBusy] = useState<'open' | 'copy' | null>(null);

  const fetchLink = useCallback(async () => {
    if (!key.startsWith('wgt_')) return null;
    return getWidgetPreviewShareLink(key);
  }, [key]);

  const openTest = useCallback(async () => {
    if (!key.startsWith('wgt_')) return;
    setBusy('open');
    try {
      const link = await fetchLink();
      const url = resolvePublicTestUrl(key, link);
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
      setBusy(null);
    }
  }, [fetchLink, key]);

  const copyLink = useCallback(async () => {
    if (!key.startsWith('wgt_')) return;
    setBusy('copy');
    try {
      const link = await fetchLink();
      const url = resolvePublicTestUrl(key, link);
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
      setBusy(null);
    }
  }, [fetchLink, key]);

  if (!key.startsWith('wgt_')) return null;

  if (variant === 'button') {
    return (
      <Pressable
        onPress={() => void openTest()}
        disabled={busy !== null}
        style={({ pressed }) => [
          styles.cta,
          { opacity: pressed || busy ? 0.85 : 1 },
        ]}
      >
        {busy === 'open' ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="flask" size={18} color="#FFFFFF" />
        )}
        <Typography variant="medium" color="#FFFFFF" style={{ fontWeight: '700' }}>
          Open public test
        </Typography>
      </Pressable>
    );
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => void openTest()}
        disabled={busy !== null}
        accessibilityRole="button"
        accessibilityLabel={`Test widget ${key}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconBtn,
          { opacity: pressed || busy === 'open' ? 0.7 : 1 },
        ]}
      >
        {busy === 'open' ? (
          <ActivityIndicator color="#A78BFA" size="small" />
        ) : (
          <Ionicons name="flask-outline" size={18} color="#A78BFA" />
        )}
      </Pressable>
      <Pressable
        onPress={() => void copyLink()}
        disabled={busy !== null}
        accessibilityRole="button"
        accessibilityLabel={`Copy test link for ${key}`}
        hitSlop={8}
        style={({ pressed }) => [
          styles.iconBtn,
          { opacity: pressed || busy === 'copy' ? 0.7 : 1 },
        ]}
      >
        {busy === 'copy' ? (
          <ActivityIndicator color="#94A3B8" size="small" />
        ) : (
          <Ionicons name="copy-outline" size={18} color="#CBD5E1" />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
  },
});
