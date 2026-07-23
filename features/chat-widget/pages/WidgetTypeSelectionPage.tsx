import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  SelectField,
  Typography,
} from '@/components/ui';
import { WidgetTypeSelectionCards } from '@/components/dashboard/chat-widget/WidgetTypeSelectionCards';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { useAuth, useResellerListScope } from '@/lib/auth';
import {
  readChatWizardDraft,
  resetCreateWizardDraft,
  saveChatWizardDraft,
} from '@/lib/chat-widget/chat-wizard-edit';
import { loadInquiryTopicsFromScheduling } from '@/lib/chat-widget/hydrate-widget-inquiry-from-scheduling';
import {
  clampWidgetKind,
  pickDefaultWidgetKind,
  resolveAllowedWidgetKinds,
} from '@/lib/chat-widget/widget-kind-entitlement';
import {
  createRemoteWidgetDraftWithMeta,
  isServerWidgetDraftAlive,
} from '@/lib/chat-widget/widget-remote-sync';
import {
  findConflictingWebsiteWidgets,
  wizardEntryPathForKind,
} from '@/lib/chat-widget/widget-type-conflicts';
import { useWebsiteWidgetsQuery } from '@/lib/chat-widget/use-website-widgets-query';
import type { WidgetDraft, WidgetKind } from '@/lib/chat-widget/widgetDraft';
import { appendWizardSaveTraceToSession } from '@/lib/chat-widget/widget-wizard-save-trace';
import {
  extractChildCompanyOptionsForParentFromByResellerTree,
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from '@/lib/companies/scope-tree-options';
import {
  buildWebsitesInScopeParams,
  useCompaniesSetupResellersQuery,
  useScopedCompanyTreeQuery,
  useWebsiteAssignmentsWebsitesQuery,
} from '@/lib/hooks';
import { websiteAssignmentItemToSelectOption } from '@/lib/websites/format-website-select-label';
import { useAppTheme } from '@/theme';

function toMobileWizardHref(webPath: string): Href {
  const path = webPath.replace(/^\/dashboard/, '') || '/chat-widget';
  return `/(dashboard)${path}` as Href;
}

function parsePreferKind(raw: unknown): WidgetKind | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'text' || v === 'chat' || v === 'both') return v;
  return null;
}

/**
 * Add Widget → Widget Type Selection.
 * Web: /dashboard/chat-widget/add?prefer=text|chat|both
 * Open: GET /companies/setup/resellers
 * Reseller: GET /companies?view=tree&sortBy=name&sortOrder=asc&all=true&resellerId=
 * Parent+Child: GET /website-assignments/websites?all=true&resellerId=&parentCompanyId=&childCompanyId=
 * Website: GET /widgets?websiteId=&all=true
 */
export function WidgetTypeSelectionPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const params = useLocalSearchParams<{ prefer?: string | string[] }>();
  const preferKind = parsePreferKind(params.prefer);
  const { hasPage } = useAuth();
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();

  const allowedWidgetKinds = useMemo(
    () => resolveAllowedWidgetKinds(hasPage),
    [hasPage],
  );

  const initialKind = useMemo(() => {
    const preferred = preferKind ?? 'chat';
    return (
      clampWidgetKind(preferred, allowedWidgetKinds) ??
      pickDefaultWidgetKind(allowedWidgetKinds) ??
      'chat'
    );
  }, [preferKind, allowedWidgetKinds]);

  const [selectedType, setSelectedType] = useState<WidgetKind>(initialKind);
  const selectedTypeRef = useRef<WidgetKind>(initialKind);
  const [resellerId, setResellerId] = useState('');
  const [parentCompanyId, setParentCompanyId] = useState('');
  const [childCompanyId, setChildCompanyId] = useState('');
  const [websiteId, setWebsiteId] = useState('');
  const [creatingDraft, setCreatingDraft] = useState(false);

  const listHref = (
    preferKind === 'text'
      ? '/(dashboard)/text-us'
      : '/(dashboard)/chat-widget'
  ) as Href;

  /** GET /companies/setup/resellers */
  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: canFilterByResellerId,
  });

  useEffect(() => {
    resetCreateWizardDraft();
    if (!canFilterByResellerId && sessionResellerId) {
      setResellerId(sessionResellerId);
    }
    // prefer=text from Add Text Us is applied via initialKind / clamp below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!preferKind) return;
    const clamped =
      clampWidgetKind(preferKind, allowedWidgetKinds) ??
      pickDefaultWidgetKind(allowedWidgetKinds);
    if (clamped) {
      setSelectedType(clamped);
      selectedTypeRef.current = clamped;
    }
  }, [preferKind, allowedWidgetKinds]);

  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  useEffect(() => {
    const clamped =
      clampWidgetKind(selectedType, allowedWidgetKinds) ??
      pickDefaultWidgetKind(allowedWidgetKinds);
    if (clamped && clamped !== selectedType) {
      setSelectedType(clamped);
      selectedTypeRef.current = clamped;
    }
  }, [allowedWidgetKinds, selectedType]);

  /**
   * Reseller selected →
   * GET /companies?view=tree&sortBy=name&sortOrder=asc&all=true&resellerId=
   */
  const companiesTreeQuery = useScopedCompanyTreeQuery(
    resellerId,
    canFilterByResellerId,
    sessionResellerId ?? '',
    {
      enabled: canFilterByResellerId
        ? resellerId.trim().length > 0
        : true,
    },
  );

  /**
   * Parent + child selected →
   * GET /website-assignments/websites?all=true&resellerId=&parentCompanyId=&childCompanyId=
   */
  const websitesParams = useMemo(
    () =>
      buildWebsitesInScopeParams({
        canFilterByResellerId,
        all: true,
        resellerId,
        parentCompanyId,
        childCompanyId,
      }),
    [canFilterByResellerId, resellerId, parentCompanyId, childCompanyId],
  );

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(websitesParams, {
    allowResellerIdFilter: canFilterByResellerId,
    enabled:
      parentCompanyId.trim().length > 0 &&
      childCompanyId.trim().length > 0 &&
      (canFilterByResellerId ? resellerId.trim().length > 0 : true),
  });

  /** Website selected → GET /widgets?websiteId=&all=true */
  const siteWidgetsQuery = useWebsiteWidgetsQuery(
    websiteId,
    Boolean(websiteId.trim()),
  );

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId) {
      setResellerId(sessionResellerId);
    }
  }, [canFilterByResellerId, sessionResellerId]);

  useEffect(() => {
    const next =
      clampWidgetKind(selectedType, allowedWidgetKinds) ??
      pickDefaultWidgetKind(allowedWidgetKinds);
    if (next && next !== selectedType) setSelectedType(next);
  }, [allowedWidgetKinds, selectedType]);

  const resellerOptions = useMemo(() => {
    const base = pickItemsArray(resellersQuery.data)
      .map(toIdNameOption)
      .filter((o): o is { value: string; label: string } => o !== null);
    if (base.length === 0) {
      return [
        {
          value: '',
          label: resellersQuery.isLoading
            ? 'Loading resellers…'
            : 'No resellers available',
        },
      ];
    }
    return [{ value: '', label: 'Select reseller' }, ...base];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentCompanyOptions = useMemo(() => {
    if (canFilterByResellerId && !resellerId.trim()) {
      return [{ value: '', label: 'Select reseller first' }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(
      companiesTreeQuery.data,
    ).map((o) => ({ value: o.value, label: o.label }));
    if (extracted.length > 0) {
      return [{ value: '', label: 'Select parent company' }, ...extracted];
    }
    return [
      {
        value: '',
        label: companiesTreeQuery.isLoading
          ? 'Loading parent companies…'
          : 'No parent companies available',
      },
    ];
  }, [
    canFilterByResellerId,
    resellerId,
    companiesTreeQuery.data,
    companiesTreeQuery.isLoading,
  ]);

  const childCompanyRows = useMemo(() => {
    if (
      (canFilterByResellerId && !resellerId.trim()) ||
      !parentCompanyId.trim()
    ) {
      return [];
    }
    return extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      parentCompanyId,
    );
  }, [
    canFilterByResellerId,
    resellerId,
    parentCompanyId,
    companiesTreeQuery.data,
  ]);

  const childCompanyOptions = useMemo(() => {
    if (canFilterByResellerId && !resellerId.trim()) {
      return [{ value: '', label: 'Select reseller first' }];
    }
    if (!parentCompanyId.trim()) {
      return [{ value: '', label: 'Select parent company first' }];
    }
    if (childCompanyRows.length > 0) {
      return [{ value: '', label: 'Select child company' }, ...childCompanyRows];
    }
    return [
      {
        value: '',
        label: companiesTreeQuery.isLoading
          ? 'Loading child companies…'
          : 'No child companies for this parent',
      },
    ];
  }, [
    canFilterByResellerId,
    resellerId,
    parentCompanyId,
    childCompanyRows,
    companiesTreeQuery.isLoading,
  ]);

  const websiteRows = useMemo(
    () => websitesQuery.data?.data?.items ?? [],
    [websitesQuery.data?.data?.items],
  );

  const websiteOptions = useMemo(() => {
    if (canFilterByResellerId && !resellerId.trim()) {
      return [{ value: '', label: 'Select reseller first' }];
    }
    if (!parentCompanyId.trim()) {
      return [{ value: '', label: 'Select parent company first' }];
    }
    if (!childCompanyId.trim()) {
      return [{ value: '', label: 'Select child company first' }];
    }
    if (websiteRows.length === 0) {
      return [
        {
          value: '',
          label: websitesQuery.isFetching
            ? 'Loading websites…'
            : 'No websites for this child company',
        },
      ];
    }
    return [
      { value: '', label: 'Select website' },
      ...websiteRows.map((w) => websiteAssignmentItemToSelectOption(w)),
    ];
  }, [
    canFilterByResellerId,
    resellerId,
    parentCompanyId,
    childCompanyId,
    websiteRows,
    websitesQuery.isFetching,
  ]);

  useEffect(() => {
    if (!websiteId || websiteRows.length === 0) return;
    const ok = websiteRows.some((w) => w.websiteId === websiteId);
    if (!ok) setWebsiteId('');
  }, [websiteRows, websiteId]);

  useEffect(() => {
    if (!childCompanyId || childCompanyRows.length === 0) return;
    const ok = childCompanyRows.some((c) => c.value === childCompanyId);
    if (!ok) setChildCompanyId('');
  }, [childCompanyRows, childCompanyId]);

  const hierarchyReady =
    (canFilterByResellerId ? Boolean(resellerId.trim()) : true) &&
    Boolean(parentCompanyId.trim()) &&
    Boolean(childCompanyId.trim());

  const hasWebsiteChoices = websiteRows.length > 0;
  const websitesLoading =
    hierarchyReady && websitesQuery.isFetching && !websitesQuery.data;

  const canContinue =
    allowedWidgetKinds.length > 0 &&
    hierarchyReady &&
    Boolean(websiteId.trim()) &&
    hasWebsiteChoices &&
    !websitesLoading &&
    !creatingDraft;

  const conflicts = useMemo(
    () =>
      findConflictingWebsiteWidgets(
        siteWidgetsQuery.data ?? [],
        selectedType,
      ),
    [siteWidgetsQuery.data, selectedType],
  );

  const subtitle = websitesLoading
    ? 'Loading websites for the selected child company…'
    : canFilterByResellerId
      ? 'Select reseller → parent company → child company, then choose a website.'
      : 'Select parent company → child company, then choose a website.';

  const runCreateAndContinue = async () => {
    if (!websiteId.trim() || !hierarchyReady || creatingDraft) return;
    const wid = websiteId.trim();
    const kind = selectedTypeRef.current;
    const prev = readChatWizardDraft(null);

    let needNewRemote =
      !prev.remoteWidgetKey?.trim() ||
      prev.websiteId?.trim() !== wid ||
      prev.type !== kind;

    if (!needNewRemote && prev.remoteWidgetKey?.trim()) {
      try {
        const alive = await isServerWidgetDraftAlive(prev.remoteWidgetKey);
        if (!alive) needNewRemote = true;
      } catch (err) {
        Alert.alert(
          'Draft',
          extractApiErrorMessage(
            err,
            'Could not verify existing widget draft.',
          ),
        );
        return;
      }
    }

    const base: WidgetDraft = {
      ...prev,
      type: kind,
      websiteId: wid,
      tenantResellerId: (
        canFilterByResellerId ? resellerId : sessionResellerId ?? ''
      ).trim(),
      tenantParentCompanyId: parentCompanyId.trim(),
      tenantChildCompanyId: childCompanyId.trim(),
      completed: false,
    };

    setCreatingDraft(true);
    try {
      if (needNewRemote) {
        /** POST /widgets/installations */
        const created = await createRemoteWidgetDraftWithMeta({
          draft: base,
          widgetKind: kind,
        });
        appendWizardSaveTraceToSession({
          stepKey: 'website',
          stepLabel: 'Step 0 — Website & type',
          method: created.meta.method,
          path: created.meta.path,
          scope: 'create',
          publishNow: created.meta.publishNow,
          requestBody: created.meta.requestBody,
          responseBody: created.meta.inner,
        });
        /** GET /chat/settings/websites/:id/visitor-topics */
        const fromScheduling = await loadInquiryTopicsFromScheduling(wid);
        saveChatWizardDraft(null, {
          ...base,
          remoteWidgetKey: created.widgetKey,
          widgetId: created.widgetKey,
          requiresPublishBeforeEmbed: created.requiresPublishBeforeEmbed,
          ...(fromScheduling.length > 0
            ? { inquiryOptions: fromScheduling, inquiryOn: true }
            : {}),
        });
      } else {
        const fromScheduling = await loadInquiryTopicsFromScheduling(wid);
        saveChatWizardDraft(null, {
          ...base,
          ...(fromScheduling.length > 0
            ? { inquiryOptions: fromScheduling, inquiryOn: true }
            : {}),
        });
      }

      /** Navigate → /chat-widget/add/chat/button (or text) */
      router.push(toMobileWizardHref(wizardEntryPathForKind(kind)));
    } catch (err) {
      Alert.alert(
        'Create draft',
        extractApiErrorMessage(
          err,
          'Could not create widget draft on the server.',
        ),
      );
    } finally {
      setCreatingDraft(false);
    }
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (conflicts.length > 0) {
      Alert.alert(
        'Widget already exists',
        'This website already has a conflicting widget type. Continue anyway?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: () => void runCreateAndContinue(),
          },
        ],
      );
      return;
    }
    void runCreateAndContinue();
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.push(listHref)}
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

        <DashboardPageIntro subtitle={subtitle} />

        <AppCard style={{ gap: 14 }}>
          {canFilterByResellerId ? (
            <SelectField
              label="Reseller"
              value={resellerId}
              onChange={(v) => {
                setResellerId(v);
                setParentCompanyId('');
                setChildCompanyId('');
                setWebsiteId('');
              }}
              options={resellerOptions}
              disabled={resellersQuery.isLoading}
 />
          ) : null}

          <SelectField
            label="Parent company"
            value={parentCompanyId}
            onChange={(v) => {
              setParentCompanyId(v);
              setChildCompanyId('');
              setWebsiteId('');
            }}
            options={parentCompanyOptions}
            disabled={
              (canFilterByResellerId && !resellerId.trim()) ||
              companiesTreeQuery.isLoading
            }
 />

          <SelectField
            label="Child company"
            value={childCompanyId}
            onChange={(v) => {
              setChildCompanyId(v);
              setWebsiteId('');
            }}
            options={childCompanyOptions}
            disabled={
              (canFilterByResellerId && !resellerId.trim()) ||
              !parentCompanyId.trim()
            }
 />

          <SelectField
            label="Website"
            value={websiteId}
            onChange={setWebsiteId}
            options={websiteOptions}
            disabled={
              (canFilterByResellerId && !resellerId.trim()) ||
              !parentCompanyId.trim() ||
              !childCompanyId.trim() ||
              websitesLoading
            }
 />

          {websiteId.trim() && siteWidgetsQuery.isFetching ? (
            <Typography variant="small" muted>
              Checking existing widgets on this website…
            </Typography>
          ) : null}

          <WidgetTypeSelectionCards
            selectedType={selectedType}
            onSelect={setSelectedType}
            allowedKinds={allowedWidgetKinds}
 />

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() => router.push(listHref)}
              style={styles.footerBtn}
              disabled={creatingDraft}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="compact"
              disabled={!canContinue}
              onPress={handleNext}
              style={styles.footerBtn}
            >
              {creatingDraft ? 'Saving draft…' : 'Next'}
            </Button>
          </View>
        </AppCard>
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12, paddingHorizontal: 8 },
  scroll: { paddingBottom: 32 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footerBtn: {
    flex: 1,
  },
});
