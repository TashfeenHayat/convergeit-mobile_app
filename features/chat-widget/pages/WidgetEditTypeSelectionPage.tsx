import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { JsonRecord } from '@/api/types/common.types';
import { getWidgetSnapshot, widgetResponseData } from '@/api/widgets/widgets.api';
import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { WidgetTypeSelectionCards } from '@/components/dashboard/chat-widget/WidgetTypeSelectionCards';
import { AppCard, Button, Typography } from '@/components/ui';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth } from '@/lib/auth';
import {
  clearWizardEditHydration,
  markEditWizardHydrated,
  replaceEditWizardDraftFromApi,
  saveChatWizardDraft,
} from '@/lib/chat-widget/chat-wizard-edit';
import { loadInquiryTopicsFromScheduling } from '@/lib/chat-widget/hydrate-widget-inquiry-from-scheduling';
import { mapWidgetSnapshotToWidgetDraft } from '@/lib/chat-widget/map-widget-snapshot-to-draft';
import { useWebsiteWidgetsQuery } from '@/lib/chat-widget/use-website-widgets-query';
import {
  clampWidgetKind,
  resolveAllowedWidgetKinds,
} from '@/lib/chat-widget/widget-kind-entitlement';
import {
  apiWidgetTypeToDraftKind,
} from '@/lib/chat-widget/widget-remote-sync';
import { wizardEntryPathForKind } from '@/lib/chat-widget/widget-type-conflicts';
import type { WidgetKind } from '@/lib/chat-widget/widgetDraft';
import { isRecord } from '@/lib/utils';
import { useAppTheme } from '@/theme';

function toMobileWizardHref(webPath: string): Href {
  const path = webPath.replace(/^\/dashboard/, '') || '/chat-widget';
  return `/(dashboard)${path}` as Href;
}

function pickWebsiteLabel(snapshot: JsonRecord, fallback = ''): string {
  const website = isRecord(snapshot.website) ? snapshot.website : null;
  for (const v of [
    website?.url,
    website?.hostname,
    website?.domain,
    snapshot.websiteUrl,
    snapshot.website_url,
    snapshot.websiteHostname,
    snapshot.domain,
    fallback,
  ]) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return fallback || '—';
}

/**
 * Edit widget — choose type.
 * Open: GET /widgets/:key/snapshot + visitor-topics + GET /widgets?websiteId=&all=true
 * Continue → /chat-widget/add/chat/button?edit=:key
 */
export function WidgetEditTypeSelectionPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { hasPage } = useAuth();
  const params = useLocalSearchParams<{
    widgetKey?: string;
    websiteLabel?: string;
  }>();
  const widgetKey = String(params.widgetKey ?? '').trim();
  const labelFromNav = String(
    Array.isArray(params.websiteLabel)
      ? params.websiteLabel[0]
      : params.websiteLabel ?? '',
  ).trim();

  const allowedWidgetKinds = useMemo(
    () => resolveAllowedWidgetKinds(hasPage),
    [hasPage],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [websiteId, setWebsiteId] = useState('');
  const [websiteLabel, setWebsiteLabel] = useState(labelFromNav || '—');
  const [selectedType, setSelectedType] = useState<WidgetKind>('chat');
  const [continuing, setContinuing] = useState(false);

  /** GET /widgets?websiteId=&all=true */
  useWebsiteWidgetsQuery(websiteId, websiteId.length > 0);

  useEffect(() => {
    if (!widgetKey) {
      setLoading(false);
      setError('Missing widget key.');
      return;
    }

    let cancelled = false;
    clearWizardEditHydration(widgetKey);
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        /** GET /widgets/:widgetKey/snapshot */
        const res = await getWidgetSnapshot(widgetKey);
        if (cancelled) return;
        const data = widgetResponseData<JsonRecord>(res);
        const mapped = mapWidgetSnapshotToWidgetDraft(data, widgetKey);
        const wid =
          mapped.websiteId?.trim() ||
          (typeof data.websiteId === 'string' ? data.websiteId.trim() : '') ||
          (typeof data.website_id === 'string' ? data.website_id.trim() : '');

        /** GET /chat/settings/websites/:id/visitor-topics */
        if (wid) {
          const fromScheduling = await loadInquiryTopicsFromScheduling(wid);
          if (fromScheduling.length > 0) {
            mapped.inquiryOptions = fromScheduling;
            mapped.inquiryOn = true;
          }
        }

        const kind =
          clampWidgetKind(
            mapped.type ??
              apiWidgetTypeToDraftKind(
                data.widgetType ?? data.widget_type ?? 'CHAT',
              ),
            allowedWidgetKinds,
          ) ?? 'chat';

        replaceEditWizardDraftFromApi(widgetKey, {
          ...mapped,
          type: kind,
          websiteId: wid || mapped.websiteId,
          remoteWidgetKey: widgetKey,
          widgetId: widgetKey,
        });
        markEditWizardHydrated(widgetKey);

        if (!cancelled) {
          setWebsiteId(wid);
          setWebsiteLabel(pickWebsiteLabel(data, labelFromNav));
          setSelectedType(kind);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            extractApiErrorMessage(e, 'Failed to load widget for editing.'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [widgetKey, allowedWidgetKinds, labelFromNav]);

  const handleContinue = () => {
    if (!widgetKey || continuing) return;
    setContinuing(true);
    try {
      const kind =
        clampWidgetKind(selectedType, allowedWidgetKinds) ?? selectedType;
      saveChatWizardDraft(widgetKey, {
        type: kind,
        remoteWidgetKey: widgetKey,
        widgetId: widgetKey,
        websiteId: websiteId || undefined,
      });
      router.push(
        toMobileWizardHref(wizardEntryPathForKind(kind, widgetKey)),
      );
    } catch (err) {
      Alert.alert('Continue failed', extractApiErrorMessage(err));
    } finally {
      setContinuing(false);
    }
  };

  if (!widgetKey) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <Typography variant="medium" muted>
          Missing widget key.
        </Typography>
      </MobileScreen>
    );
  }

  if (loading) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <ActivityIndicator color={accent} />
        <Typography variant="small" muted style={{ marginTop: 10 }}>
          Loading widget…
        </Typography>
      </MobileScreen>
    );
  }

  if (error) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.center}>
        <Typography variant="medium" color={theme.app.danger}>
          {error}
        </Typography>
        <Button
          size="compact"
          variant="secondary"
          style={{ marginTop: 12 }}
          onPress={() =>
            router.push('/(dashboard)/chat-widget' as Href)
          }
        >
          Back to list
        </Button>
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

        <DashboardPageIntro subtitle="Confirm Chat, Text Us, or both — then continue to the design wizard." />

        <AppCard style={{ gap: theme.spacing.md }}>
          <Typography variant="medium" style={{ fontWeight: '800' }}>
            Widget type
          </Typography>
          <View
            style={[
              styles.metaBox,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Typography variant="small" muted>
              Website (fixed for this widget)
            </Typography>
            <Typography variant="medium" style={{ fontWeight: '600' }}>
              {websiteLabel}
            </Typography>
            <Typography variant="small" muted style={{ marginTop: 8 }}>
              Widget key
            </Typography>
            <Typography variant="small" style={{ fontWeight: '600' }}>
              {widgetKey}
            </Typography>
          </View>

          <WidgetTypeSelectionCards
            selectedType={selectedType}
            onSelect={setSelectedType}
            allowedKinds={allowedWidgetKinds}
 />

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() =>
                router.push('/(dashboard)/chat-widget' as Href)
              }
              style={styles.footerBtn}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="compact"
              loading={continuing}
              disabled={continuing}
              onPress={handleContinue}
              style={styles.footerBtn}
            >
              Continue to wizard
            </Button>
          </View>
        </AppCard>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  metaBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footerBtn: { flex: 1 },
});
