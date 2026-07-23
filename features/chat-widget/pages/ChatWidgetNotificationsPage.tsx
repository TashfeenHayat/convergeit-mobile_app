import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import {
  AppCard,
  Button,
  InputField,
  SelectField,
  Typography,
} from '@/components/ui';
import { WidgetWizardToggleRow } from '@/features/chat-widget/components/WidgetWizardToggleRow';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  readChatWizardDraft,
  resolveRemoteWidgetKeyForChatWizard,
  saveChatWizardDraft,
  useChatWidgetWizardEdit,
  withChatEditQuery,
} from '@/lib/chat-widget/chat-wizard-edit';
import { loadInquiryTopicsFromScheduling } from '@/lib/chat-widget/hydrate-widget-inquiry-from-scheduling';
import { findLauncherIconPreset } from '@/lib/chat-widget/launcher-icon-presets';
import {
  persistVisitorTopicsIfValid,
  syncInquiryToWidgetJson,
} from '@/lib/chat-widget/sync-inquiry-topics';
import { DEFAULT_TALK_TO_AGENT_BUTTON_LABEL } from '@/lib/chat-widget/talk-to-agent.constants';
import { useWizardLauncherChrome } from '@/lib/chat-widget/use-wizard-launcher-preview';
import {
  WIDGET_AI_TYPE_OPTIONS,
  normalizeWidgetAiType,
  shouldShowWidgetAiType,
  type WidgetAiType,
} from '@/lib/chat-widget/widget-ai-type';
import {
  normalizeWidgetInquiryOptions,
  slugRoutingKeyFromLabel,
  type WidgetInquiryOption,
} from '@/lib/chat-widget/widget-inquiry.types';
import {
  patchRemoteWidgetConfiguration,
  resolveWizardKindFromDraft,
} from '@/lib/chat-widget/widget-remote-sync';
import {
  defaultWidgetDraft,
  type WidgetDraft,
  type WidgetInstallChatMode,
} from '@/lib/chat-widget/widgetDraft';
import { useDepartmentsListQuery } from '@/lib/hooks/query/hrms/departments';
import { useWebsiteAssignmentDetailQuery } from '@/lib/hooks/query/website-assignments/hooks';
import { pickApiItems } from '@/lib/utils/admin-list';
import { isRecord, pickStr } from '@/lib/utils/core';
import { normalizeLauncherBadgeMode } from '@/lib/widget-runtime/widget-notifications';
import { useAppTheme } from '@/theme';

const STEPS = [
  { n: '01', label: 'LAUNCHER', hint: 'Button design' },
  { n: '02', label: 'PANEL & TOPICS', hint: 'Chat box' },
  { n: '03', label: 'ALERTS & FORMS', hint: 'Notifications' },
  { n: '04', label: 'PUBLISH & EMBED', hint: 'Install' },
] as const;

type PreviewTab = 'visitor' | 'offline' | 'chat';
type BadgeMode = 'count' | 'dot' | 'none';

function emptyInquiryOption(): WidgetInquiryOption {
  return {
    label: '',
    routingKey: '',
    serviceChannel: 'external',
    internalDepartmentId: null,
    externalDepartmentId: null,
    internalPoolId: null,
    externalPoolId: null,
  };
}

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

function parseDelaySeconds(raw: string, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(300, Math.max(0, n));
}

/**
 * Widget Customization — Step 3 Alerts & Forms.
 * Open: visitor-topics + website detail + HRMS departments.
 * Next: PATCH notifications_only → Install.
 */
export function ChatWidgetNotificationsPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { editWidgetKey, draftReady, hydrateError } = useChatWidgetWizardEdit();
  const editKey = editWidgetKey || null;
  const { chromeDraft, launcherChrome } = useWizardLauncherChrome(
    editWidgetKey || undefined,
    draftReady,
    0,
  );

  const [hydrating, setHydrating] = useState(true);
  const [savingNext, setSavingNext] = useState(false);
  const [savingTopics, setSavingTopics] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('visitor');
  const [websiteId, setWebsiteId] = useState('');

  const [browserNotification, setBrowserNotification] = useState(true);
  const [soundNotification, setSoundNotification] = useState(false);
  const [launcherBadgeMode, setLauncherBadgeMode] =
    useState<BadgeMode>('count');
  const [fallbackNotificationText, setFallbackNotificationText] = useState(
    'You have a new message from support.',
  );

  const [chatMode, setChatMode] = useState<WidgetInstallChatMode>('HYBRID');
  const [aiType, setAiType] = useState<WidgetAiType>('AI_CHATBOT');
  const [talkToAgentEnabled, setTalkToAgentEnabled] = useState(true);
  const [talkToAgentLabel, setTalkToAgentLabel] = useState<string>(
    DEFAULT_TALK_TO_AGENT_BUTTON_LABEL,
  );
  const [offlineMessage, setOfflineMessage] = useState(
    'We are offline; leave a message and we will reply.',
  );
  const [allowedDomainsText, setAllowedDomainsText] = useState(
    'example.com, app.example.com',
  );

  const [inquiryRequired, setInquiryRequired] = useState(false);
  const [inquirySkipLabel, setInquirySkipLabel] = useState('General question');
  const [inquiryFallbackKey, setInquiryFallbackKey] = useState('');
  const [inquiryOptions, setInquiryOptions] = useState<WidgetInquiryOption[]>([
    emptyInquiryOption(),
  ]);

  const [botEnabled, setBotEnabled] = useState(true);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState(false);
  const [autoOpenOnReturnVisit, setAutoOpenOnReturnVisit] = useState(false);
  const [autoOpenDelay, setAutoOpenDelay] = useState('10');
  const [motionEnabled, setMotionEnabled] = useState(true);

  const [formEnabled, setFormEnabled] = useState(true);
  const [formTitle, setFormTitle] = useState('Before we start');
  const [formSubtitle, setFormSubtitle] = useState('Tell us who you are');
  const [formSubmitLabel, setFormSubmitLabel] = useState('Start chat');
  const [prechatName, setPrechatName] = useState(true);
  const [prechatEmail, setPrechatEmail] = useState(true);
  const [prechatPhone, setPrechatPhone] = useState(false);
  const [prechatMessage, setPrechatMessage] = useState(true);
  const [prechatMessageRequired, setPrechatMessageRequired] = useState(false);
  const [consentRequired, setConsentRequired] = useState(true);
  const [consentText, setConsentText] = useState(
    'I agree to the chat terms and privacy policy.',
  );
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(
    'https://www.example.com/privacy',
  );

  const [offlineFormEnabled, setOfflineFormEnabled] = useState(true);
  const [offlineFormTitle, setOfflineFormTitle] = useState(
    'Leave us a message',
  );
  const [offlineFormSubtitle, setOfflineFormSubtitle] = useState(
    "We're away right now — tell us how we can help.",
  );
  const [offlineFormSubmitLabel, setOfflineFormSubmitLabel] =
    useState('Send message');
  const [offlineName, setOfflineName] = useState(true);
  const [offlineEmail, setOfflineEmail] = useState(true);
  const [offlinePhone, setOfflinePhone] = useState(false);
  const [offlineMessageField, setOfflineMessageField] = useState(true);
  const [offlineMessageRequired, setOfflineMessageRequired] = useState(true);

  const detailQuery = useWebsiteAssignmentDetailQuery(websiteId, {
    enabled: websiteId.length > 0,
  });
  const parentCompanyId =
    detailQuery.data?.data?.parentCompanyId?.trim() ||
    readChatWizardDraft(editKey).tenantParentCompanyId?.trim() ||
    '';

  const internalDeptsQuery = useDepartmentsListQuery(
    { all: true, type: 'Internal' },
    { enabled: websiteId.length > 0, scope: 'widget-alerts-internal' },
  );
  const externalDeptsQuery = useDepartmentsListQuery(
    { all: true, type: 'External', parentCompanyId },
    {
      enabled: websiteId.length > 0 && parentCompanyId.length > 0,
      scope: `widget-alerts-external:${parentCompanyId}`,
    },
  );

  const internalOptions = useMemo(
    () => mapDeptOptions(internalDeptsQuery.data),
    [internalDeptsQuery.data],
  );
  const externalOptions = useMemo(
    () => mapDeptOptions(externalDeptsQuery.data),
    [externalDeptsQuery.data],
  );
  const departmentSelectOptions = useMemo(
    () => [
      { value: '', label: 'Select department…' },
      ...externalOptions.map((o) => ({ value: o.value, label: o.label })),
    ],
    [externalOptions],
  );
  const fallbackTopicOptions = useMemo(
    () => [
      { value: '', label: 'Select fallback topic…' },
      ...inquiryOptions
        .filter((t) => t.routingKey.trim() || t.label.trim())
        .map((t) => ({
          value: t.routingKey.trim() || slugRoutingKeyFromLabel(t.label),
          label: t.label.trim() || t.routingKey,
        })),
    ],
    [inquiryOptions],
  );

  const applyDraftToState = (d: WidgetDraft) => {
    setWebsiteId(d.websiteId?.trim() ?? '');
    setBrowserNotification(d.browserNotification !== false);
    setSoundNotification(d.soundNotification === true);
    setLauncherBadgeMode(
      normalizeLauncherBadgeMode(d.launcherBadgeMode) as BadgeMode,
    );
    setFallbackNotificationText(
      d.fallbackNotificationText?.trim() ||
        defaultWidgetDraft.fallbackNotificationText ||
        'You have a new message from support.',
    );
    setChatMode((d.chatMode as WidgetInstallChatMode) || 'HYBRID');
    setAiType(normalizeWidgetAiType(d.aiType));
    setTalkToAgentEnabled(d.responseTalkToAgentEnabled !== false);
    setTalkToAgentLabel(
      d.responseTalkToAgentTriggerText?.trim() ||
        DEFAULT_TALK_TO_AGENT_BUTTON_LABEL,
    );
    setOfflineMessage(
      d.responseOfflineMessage?.trim() ||
        defaultWidgetDraft.responseOfflineMessage ||
        'We are offline; leave a message and we will reply.',
    );
    setAllowedDomainsText(
      d.allowedDomainsText?.trim() ||
        (d.allowedDomains?.length ? d.allowedDomains.join(', ') : '') ||
        'example.com, app.example.com',
    );
    setInquiryRequired(d.inquiryRequired === true);
    setInquirySkipLabel(
      d.inquirySkipLabel?.trim() ||
        defaultWidgetDraft.inquirySkipLabel ||
        'General question',
    );
    setInquiryFallbackKey(d.inquiryFallbackRoutingKey?.trim() || '');
    const opts = normalizeWidgetInquiryOptions(d.inquiryOptions);
    setInquiryOptions(opts.length > 0 ? opts : [emptyInquiryOption()]);
    setBotEnabled(d.botEnabled !== false);
    setAutoOpenEnabled(d.autoOpenEnabled === true);
    setAutoOpenOnReturnVisit(d.autoOpenOnReturnVisit === true);
    setAutoOpenDelay(String(d.autoOpenDelaySeconds ?? 10));
    setMotionEnabled(d.motionEnabled !== false);
    setFormEnabled(d.formEnabled !== false);
    setFormTitle(d.formTitle?.trim() || 'Before we start');
    setFormSubtitle(d.formSubtitle?.trim() || 'Tell us who you are');
    setFormSubmitLabel(d.formSubmitLabel?.trim() || 'Start chat');
    setPrechatName(d.prechatNameEnabled !== false);
    setPrechatEmail(d.prechatEmailEnabled !== false);
    setPrechatPhone(d.prechatPhoneEnabled === true);
    setPrechatMessage(d.prechatMessageEnabled !== false);
    setPrechatMessageRequired(d.prechatMessageRequired === true);
    setConsentRequired(d.consentRequired !== false);
    setConsentText(
      d.consentText?.trim() ||
        'I agree to the chat terms and privacy policy.',
    );
    setPrivacyPolicyUrl(
      d.privacyPolicyUrl?.trim() || 'https://www.example.com/privacy',
    );
    setOfflineFormEnabled(d.offlineFormEnabled !== false);
    setOfflineFormTitle(
      d.offlineFormTitle?.trim() || 'Leave us a message',
    );
    setOfflineFormSubtitle(
      d.offlineFormSubtitle?.trim() ||
        "We're away right now — tell us how we can help.",
    );
    setOfflineFormSubmitLabel(
      d.offlineFormSubmitLabel?.trim() || 'Send message',
    );
    setOfflineName(d.offlinePrechatNameEnabled !== false);
    setOfflineEmail(d.offlinePrechatEmailEnabled !== false);
    setOfflinePhone(d.offlinePrechatPhoneEnabled === true);
    setOfflineMessageField(d.offlinePrechatMessageEnabled !== false);
    setOfflineMessageRequired(d.offlinePrechatMessageRequired !== false);
  };

  useEffect(() => {
    if (!draftReady) return;
    void (async () => {
      setHydrating(true);
      try {
        const local = readChatWizardDraft(editKey);
        applyDraftToState(local);
        const wid = local.websiteId?.trim() ?? '';
        if (wid) {
          const topics = await loadInquiryTopicsFromScheduling(wid);
          if (topics.length > 0) {
            saveChatWizardDraft(editKey, {
              inquiryOptions: topics,
              inquiryOn: true,
            });
            setInquiryOptions(topics);
            if (!local.inquiryFallbackRoutingKey?.trim()) {
              setInquiryFallbackKey(topics[0]?.routingKey ?? '');
            }
          }
        }
      } finally {
        setHydrating(false);
      }
    })();
  }, [draftReady, editKey]);

  const flushToDraft = (): WidgetDraft => {
    const prev = readChatWizardDraft(editKey);
    const domains = allowedDomainsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const patch: Partial<WidgetDraft> = {
      type: prev.type ?? 'chat',
      browserNotification,
      soundNotification,
      notificationEnabled: browserNotification || soundNotification,
      launcherBadgeMode,
      fallbackNotificationText: fallbackNotificationText.trim(),
      chatMode,
      aiType,
      responseTalkToAgentEnabled: talkToAgentEnabled,
      responseTalkToAgentTriggerText:
        talkToAgentLabel.trim() || DEFAULT_TALK_TO_AGENT_BUTTON_LABEL,
      responseOfflineMessage: offlineMessage.trim(),
      allowedDomainsText: allowedDomainsText.trim(),
      allowedDomains: domains,
      inquiryOn: true,
      inquiryRequired,
      inquirySkipLabel: inquirySkipLabel.trim() || 'General question',
      inquiryFallbackRoutingKey: inquiryFallbackKey.trim(),
      inquiryOptions: normalizeWidgetInquiryOptions(inquiryOptions),
      botEnabled,
      autoOpenEnabled,
      autoOpenOnReturnVisit,
      autoOpenDelaySeconds: parseDelaySeconds(autoOpenDelay, 10),
      motionEnabled,
      formEnabled,
      formTitle: formTitle.trim(),
      formSubtitle: formSubtitle.trim(),
      formSubmitLabel: formSubmitLabel.trim(),
      prechatNameEnabled: prechatName,
      prechatEmailEnabled: prechatEmail,
      prechatPhoneEnabled: prechatPhone,
      prechatMessageEnabled: prechatMessage,
      prechatMessageRequired: prechatMessageRequired,
      consentRequired,
      consentText: consentText.trim(),
      privacyPolicyUrl: privacyPolicyUrl.trim(),
      offlineFormEnabled,
      offlineFormTitle: offlineFormTitle.trim(),
      offlineFormSubtitle: offlineFormSubtitle.trim(),
      offlineFormSubmitLabel: offlineFormSubmitLabel.trim(),
      offlinePrechatNameEnabled: offlineName,
      offlinePrechatEmailEnabled: offlineEmail,
      offlinePrechatPhoneEnabled: offlinePhone,
      offlinePrechatMessageEnabled: offlineMessageField,
      offlinePrechatMessageRequired: offlineMessageRequired,
    };
    saveChatWizardDraft(editKey, patch);
    return { ...prev, ...patch };
  };

  const updateTopic = (index: number, patch: Partial<WidgetInquiryOption>) => {
    setInquiryOptions((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const next = { ...t, ...patch };
        if (patch.label != null && !t.routingKey.trim()) {
          next.routingKey = slugRoutingKeyFromLabel(patch.label);
        }
        return next;
      }),
    );
  };

  const saveInquiryTopics = async () => {
    if (savingTopics) return;
    setSavingTopics(true);
    try {
      const draft = flushToDraft();
      const rows = normalizeWidgetInquiryOptions(inquiryOptions).filter(
        (r) => r.label.trim() || r.routingKey.trim(),
      );
      const persist = await persistVisitorTopicsIfValid(websiteId, rows);
      if (!persist.ok) {
        Alert.alert('Inquiry topics', persist.error);
        return;
      }
      const widgetKey = resolveRemoteWidgetKeyForChatWizard(editKey, draft);
      if (widgetKey) {
        await syncInquiryToWidgetJson({
          widgetKey,
          draft: { ...draft, inquiryOptions: rows, inquiryOn: true },
        });
      }
      setInquiryOptions(rows.length ? rows : [emptyInquiryOption()]);
      Alert.alert('Saved', 'Inquiry topics updated.');
    } catch (err) {
      Alert.alert('Save failed', extractApiErrorMessage(err));
    } finally {
      setSavingTopics(false);
    }
  };

  const badgeOptions = useMemo(
    () => [
      { value: 'count', label: 'Count badge (1, 2, …)' },
      { value: 'dot', label: 'Dot only' },
      { value: 'none', label: 'None' },
    ],
    [],
  );
  const chatModeOptions = useMemo(
    () => [
      {
        value: 'HYBRID',
        label: 'Hybrid — AI first, then human handoff',
      },
      { value: 'AI_ONLY', label: 'AI only' },
      { value: 'AGENT_ONLY', label: 'Agent only' },
    ],
    [],
  );

  const launcherColor = launcherChrome.buttonColor || '#1E63D5';
  const launcherIcon =
    findLauncherIconPreset(launcherChrome.launcherIconPreset)?.ionicon ??
    'chatbubble-outline';
  const brandColor =
    chromeDraft.themePrimaryColor?.trim() || launcherColor;

  if (!draftReady || hydrating) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            Loading alerts & forms…
          </Typography>
        </View>
      </MobileScreen>
    );
  }

  if (hydrateError) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <Typography variant="medium" color={theme.app.danger}>
            {hydrateError}
          </Typography>
        </View>
      </MobileScreen>
    );
  }

  const formFieldsPreview =
    previewTab === 'offline'
      ? [
          offlineName && 'Name',
          offlineEmail && 'Email',
          offlinePhone && 'Phone',
          offlineMessageField && 'Message',
        ].filter(Boolean)
      : [
          prechatName && 'Name',
          prechatEmail && 'Email',
          prechatPhone && 'Phone',
          prechatMessage && 'Message',
        ].filter(Boolean);

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

        <DashboardPageIntro subtitle="Notifications, routing, visitor form, and agent handoff." />

        <Typography variant="small" muted>
          Step 3 of 4 — Draft saves on each Next — full publish on Install
          (final step)
        </Typography>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: accent, width: '75%' },
            ]}
 />
        </View>
        <Typography variant="small" muted>
          75% complete
        </Typography>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepRow} showsVerticalScrollIndicator={false}>
          {STEPS.map((step, i) => {
            const active = i === 2;
            const done = i < 2;
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
            Notifications & Advanced
          </Typography>
          <Typography variant="small" muted>
            Routing, forms & alerts — Chat mode (AI / Agent / Hybrid), allowed
            domains, inquiry topic pills, pre-chat forms. Publish on Install.
          </Typography>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Notification settings
          </Typography>
          <WidgetWizardToggleRow
            label="Browser notification"
            value={browserNotification}
            onChange={setBrowserNotification}
 />
          <WidgetWizardToggleRow
            label="Sound notification"
            value={soundNotification}
            onChange={setSoundNotification}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Launcher alert on new message
          </Typography>
          <SelectField
            label="Badge style"
            value={launcherBadgeMode}
            onChange={(v) =>
              setLauncherBadgeMode(
                normalizeLauncherBadgeMode(v) as BadgeMode,
              )
            }
            options={badgeOptions}
 />
          <InputField
            label="Fallback notification text"
            value={fallbackNotificationText}
            onChangeText={setFallbackNotificationText}
 />
          <Typography variant="small" muted>
            Shown when a new message arrives in the background.
          </Typography>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Chat routing & Talk to agent
          </Typography>
          <SelectField
            label="Chat mode"
            value={chatMode}
            onChange={(v) =>
              setChatMode(
                (v === 'AI_ONLY' || v === 'AGENT_ONLY' || v === 'HYBRID'
                  ? v
                  : 'HYBRID') as WidgetInstallChatMode,
              )
            }
            options={chatModeOptions}
 />
          {shouldShowWidgetAiType(chatMode) ? (
            <View style={{ gap: 8 }}>
              <Typography variant="small" muted>
                AI type
              </Typography>
              {WIDGET_AI_TYPE_OPTIONS.map((opt) => {
                const active = aiType === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAiType(opt.value)}
                    style={[
                      styles.aiCard,
                      {
                        borderColor: active
                          ? accent
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: active
                          ? `${accent}18`
                          : 'transparent',
                      },
                    ]}
                  >
                    <View style={styles.aiCardHeader}>
                      <Typography
                        variant="small"
                        style={{ fontWeight: '700', flex: 1 }}
                        color={active ? accent : undefined}
                      >
                        {opt.label}
                      </Typography>
                      <Ionicons
                        name={
                          active ? 'radio-button-on' : 'radio-button-off'
                        }
                        size={18}
                        color={active ? accent : theme.app.text.muted}
 />
                    </View>
                    <Typography variant="small" muted>
                      {opt.description}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <WidgetWizardToggleRow
            label="Show Talk to agent button"
            value={talkToAgentEnabled}
            onChange={setTalkToAgentEnabled}
 />
          {talkToAgentEnabled ? (
            <InputField
              label="Talk to agent button label"
              value={talkToAgentLabel}
              onChangeText={setTalkToAgentLabel}
 />
          ) : null}

          <InputField
            label="Offline message"
            value={offlineMessage}
            onChangeText={setOfflineMessage}
 />
          <Typography variant="small" muted>
            When no agent is available on the site.
          </Typography>
          <InputField
            label="Allowed website domains"
            value={allowedDomainsText}
            onChangeText={setAllowedDomainsText}
            autoCapitalize="none"
 />
          <Typography variant="small" muted>
            Where the embed may load — hostnames only (not full page URLs).
          </Typography>

          {/* Inquiry topics */}
          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Inquiry topics
          </Typography>
          <WidgetWizardToggleRow
            label="Require topic selection"
            description="When off, visitors can skip with a general routing option."
            value={inquiryRequired}
            onChange={setInquiryRequired}
 />
          <InputField
            label="Skip button label"
            value={inquirySkipLabel}
            onChangeText={setInquirySkipLabel}
 />
          <Typography variant="small" muted>
            Each topic needs a client label and external department. Save
            updates visitor-topics and widget JSON.
          </Typography>
          <SelectField
            label="Fallback topic (skip / general routing)"
            value={inquiryFallbackKey}
            onChange={setInquiryFallbackKey}
            options={fallbackTopicOptions}
 />

          <View
            style={[
              styles.deptCatalog,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <Typography variant="small" muted>
              Available departments (client catalog)
            </Typography>
            <Typography variant="small" muted>
              Internal ({internalOptions.length})
            </Typography>
            <View style={styles.pillRow}>
              {internalOptions.slice(0, 8).map((d) => (
                <View
                  key={d.value}
                  style={[
                    styles.deptPill,
                    { borderColor: theme.app.dashboard.cardBorder },
                  ]}
                >
                  <Typography variant="small">{d.label}</Typography>
                </View>
              ))}
            </View>
            <Typography variant="small" muted>
              External ({externalOptions.length})
            </Typography>
            <View style={styles.pillRow}>
              {externalOptions.slice(0, 8).map((d) => (
                <View
                  key={d.value}
                  style={[
                    styles.deptPill,
                    { borderColor: theme.app.dashboard.cardBorder },
                  ]}
                >
                  <Typography variant="small">{d.label}</Typography>
                </View>
              ))}
            </View>
          </View>

          {inquiryOptions.map((topic, index) => (
            <View
              key={`topic-${index}`}
              style={[
                styles.topicCard,
                { borderColor: theme.app.dashboard.cardBorder },
              ]}
            >
              <View style={styles.topicHeader}>
                <Typography variant="medium" style={{ fontWeight: '700' }}>
                  Topic {index + 1}
                </Typography>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setInquiryOptions((prev) => {
                      const next = prev.filter((_, i) => i !== index);
                      return next.length ? next : [emptyInquiryOption()];
                    })
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color={theme.app.danger}
 />
                </Pressable>
              </View>
              <InputField
                label="Routing key"
                value={topic.routingKey}
                onChangeText={(v) => updateTopic(index, { routingKey: v })}
                autoCapitalize="none"
 />
              <InputField
                label="Client label (widget)"
                value={topic.label}
                onChangeText={(v) => updateTopic(index, { label: v })}
 />
              <SelectField
                label="Department"
                value={topic.externalDepartmentId ?? ''}
                onChange={(v) =>
                  updateTopic(index, {
                    externalDepartmentId: v || null,
                    serviceChannel: 'external',
                  })
                }
                options={departmentSelectOptions}
 />
            </View>
          ))}
          <View style={styles.rowGap}>
            <Button
              size="compact"
              variant="secondary"
              onPress={() =>
                setInquiryOptions((prev) => [...prev, emptyInquiryOption()])
              }
            >
              + Add topic
            </Button>
            <Button
              size="compact"
              loading={savingTopics}
              disabled={savingTopics || !websiteId}
              onPress={() => void saveInquiryTopics()}
            >
              Save inquiry topics
            </Button>
          </View>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Widget behavior
          </Typography>
          <WidgetWizardToggleRow
            label="AI bot enabled"
            description="Turn off to stop automatic AI replies (Hybrid / AI only)."
            value={botEnabled}
            onChange={setBotEnabled}
 />
          <WidgetWizardToggleRow
            label="Auto-open widget"
            value={autoOpenEnabled}
            onChange={setAutoOpenEnabled}
 />
          <WidgetWizardToggleRow
            label="Auto-open on return visits"
            description="When off, auto-open runs only the first time this browser sees the widget."
            value={autoOpenOnReturnVisit}
            onChange={setAutoOpenOnReturnVisit}
 />
          <InputField
            label="Auto-open delay (seconds)"
            value={autoOpenDelay}
            onChangeText={setAutoOpenDelay}
            keyboardType="number-pad"
 />
          <Typography variant="small" muted>
            Between 0 and 300.
          </Typography>
          <WidgetWizardToggleRow
            label="Subtle animations"
            description="Teaser slide-in and panel open transition on the live embed."
            value={motionEnabled}
            onChange={setMotionEnabled}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Visitor form
          </Typography>
          <WidgetWizardToggleRow
            label="Form enabled"
            description="Collect visitor details before chat starts."
            value={formEnabled}
            onChange={setFormEnabled}
 />
          {formEnabled ? (
            <>
              <InputField
                label="Form title"
                value={formTitle}
                onChangeText={setFormTitle}
 />
              <InputField
                label="Form subtitle"
                value={formSubtitle}
                onChangeText={setFormSubtitle}
 />
              <InputField
                label="Start chat button label"
                value={formSubmitLabel}
                onChangeText={setFormSubmitLabel}
 />
              <Typography variant="small" muted>
                Fields to show
              </Typography>
              <WidgetWizardToggleRow
                label="Name"
                value={prechatName}
                onChange={setPrechatName}
 />
              <WidgetWizardToggleRow
                label="Email"
                value={prechatEmail}
                onChange={setPrechatEmail}
 />
              <WidgetWizardToggleRow
                label="Phone"
                value={prechatPhone}
                onChange={setPrechatPhone}
 />
              <WidgetWizardToggleRow
                label="Message"
                value={prechatMessage}
                onChange={setPrechatMessage}
 />
              <WidgetWizardToggleRow
                label="Message required"
                value={prechatMessageRequired}
                onChange={setPrechatMessageRequired}
 />
              <WidgetWizardToggleRow
                label="Consent required"
                value={consentRequired}
                onChange={setConsentRequired}
 />
              <InputField
                label="Consent text"
                value={consentText}
                onChangeText={setConsentText}
 />
              <InputField
                label="Privacy policy URL"
                value={privacyPolicyUrl}
                onChangeText={setPrivacyPolicyUrl}
                autoCapitalize="none"
                keyboardType="url"
 />
            </>
          ) : null}

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Offline form
          </Typography>
          <Typography variant="small" muted>
            Shown when no agents are available — leads go to Chat Monitor.
          </Typography>
          <WidgetWizardToggleRow
            label="Show offline form"
            value={offlineFormEnabled}
            onChange={setOfflineFormEnabled}
 />
          {offlineFormEnabled ? (
            <>
              <InputField
                label="Form title"
                value={offlineFormTitle}
                onChangeText={setOfflineFormTitle}
 />
              <InputField
                label="Form subtitle"
                value={offlineFormSubtitle}
                onChangeText={setOfflineFormSubtitle}
 />
              <InputField
                label="Submit button label"
                value={offlineFormSubmitLabel}
                onChangeText={setOfflineFormSubmitLabel}
 />
              <Typography variant="small" muted>
                Fields to show when offline
              </Typography>
              <WidgetWizardToggleRow
                label="Name"
                value={offlineName}
                onChange={setOfflineName}
 />
              <WidgetWizardToggleRow
                label="Email"
                value={offlineEmail}
                onChange={setOfflineEmail}
 />
              <WidgetWizardToggleRow
                label="Phone"
                value={offlinePhone}
                onChange={setOfflinePhone}
 />
              <WidgetWizardToggleRow
                label="Message"
                value={offlineMessageField}
                onChange={setOfflineMessageField}
 />
              <WidgetWizardToggleRow
                label="Message required"
                value={offlineMessageRequired}
                onChange={setOfflineMessageRequired}
 />
            </>
          ) : null}

          {/* Live preview */}
          <View
            style={[
              styles.previewCard,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <View style={styles.offlineBadge}>
              <Typography
                variant="small"
                style={{ color: '#FB923C', fontWeight: '700' }}
              >
                Offline — Go live when ready
              </Typography>
            </View>
            <Typography variant="medium" style={{ fontWeight: '700' }}>
              Live preview (draft)
            </Typography>

            {browserNotification ? (
              <View style={styles.notifPreview}>
                <Typography variant="small" muted style={{ marginBottom: 6 }}>
                  Browser notification preview
                </Typography>
                <View style={styles.notifCard}>
                  <View
                    style={[
                      styles.notifIcon,
                      { backgroundColor: `${brandColor}22` },
                    ]}
                  >
                    <Ionicons
                      name="notifications"
                      size={18}
                      color={brandColor}
 />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography
                      variant="small"
                      style={{ fontWeight: '700', color: '#0f172a' }}
                    >
                      Your website
                    </Typography>
                    <Typography variant="small" style={{ color: '#334155' }}>
                      {fallbackNotificationText.trim() ||
                        'You have a new message from support.'}
                    </Typography>
                  </View>
                </View>
              </View>
            ) : null}

            <Typography variant="small" muted>
              Launcher badge & message preview
            </Typography>
            <View style={styles.siteMock}>
              <View style={styles.siteMockInner}>
                <View
                  style={[
                    styles.teaserBubble,
                    { borderColor: `${brandColor}55` },
                  ]}
                >
                  <Typography
                    variant="small"
                    style={{ color: '#e2e8f0', fontSize: 11 }}
                  >
                    {fallbackNotificationText.trim() ||
                      'You have a new message from support.'}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.fab,
                    { backgroundColor: launcherColor },
                  ]}
                >
                  <Ionicons name={launcherIcon} size={20} color="#fff" />
                  {launcherBadgeMode !== 'none' ? (
                    <View
                      style={[
                        styles.fabBadge,
                        launcherBadgeMode === 'dot'
                          ? styles.fabBadgeDot
                          : null,
                        { backgroundColor: brandColor },
                      ]}
                    >
                      {launcherBadgeMode === 'count' ? (
                        <Typography
                          variant="small"
                          color="#fff"
                          style={{ fontSize: 10, fontWeight: '800' }}
                        >
                          1
                        </Typography>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
              <Typography variant="small" muted style={{ marginTop: 6 }}>
                1280×720px · site mock
              </Typography>
            </View>

            <Typography variant="medium" style={{ fontWeight: '700' }}>
              Forms & chat preview
            </Typography>
            <View style={styles.tabRow}>
              {(
                [
                  ['visitor', 'Visitor form'],
                  ['offline', 'Offline form'],
                  ['chat', 'Chat'],
                ] as const
              ).map(([id, label]) => {
                const active = previewTab === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setPreviewTab(id)}
                    style={[
                      styles.tabBtn,
                      {
                        borderColor: active
                          ? accent
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: active
                          ? `${accent}22`
                          : 'transparent',
                      },
                    ]}
                  >
                    <Typography
                      variant="small"
                      color={active ? accent : undefined}
                      style={{ fontWeight: '700' }}
                    >
                      {label}
                    </Typography>
                  </Pressable>
                );
              })}
            </View>

            {previewTab === 'chat' ? (
              <View style={styles.formPreviewCard}>
                <View
                  style={[
                    styles.chatHeader,
                    { backgroundColor: brandColor },
                  ]}
                >
                  <Typography
                    variant="small"
                    color="#fff"
                    style={{ fontWeight: '700' }}
                  >
                    AI Agent
                  </Typography>
                </View>
                <View style={styles.chatBody}>
                  <View style={styles.chatBubble}>
                    <Typography
                      variant="small"
                      style={{ color: '#0f172a' }}
                    >
                      Hi! How can we help today?
                    </Typography>
                  </View>
                  {talkToAgentEnabled ? (
                    <View
                      style={[
                        styles.talkBtn,
                        { borderColor: brandColor },
                      ]}
                    >
                      <Typography
                        variant="small"
                        color={brandColor}
                        style={{ fontWeight: '700' }}
                      >
                        {talkToAgentLabel.trim() ||
                          DEFAULT_TALK_TO_AGENT_BUTTON_LABEL}
                      </Typography>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : (
              <View style={styles.formPreviewCard}>
                <Typography
                  variant="medium"
                  style={{ fontWeight: '800', color: '#0f172a' }}
                >
                  {previewTab === 'offline'
                    ? offlineFormTitle
                    : formTitle}
                </Typography>
                <Typography
                  variant="small"
                  style={{ color: '#64748b', marginBottom: 8 }}
                >
                  {previewTab === 'offline'
                    ? offlineFormSubtitle
                    : formSubtitle}
                </Typography>
                {formFieldsPreview.map((label) => (
                  <View key={String(label)} style={styles.fakeField}>
                    <Typography
                      variant="small"
                      style={{ color: '#94a3b8' }}
                    >
                      {label}
                    </Typography>
                  </View>
                ))}
                <View
                  style={[
                    styles.startBtn,
                    { backgroundColor: brandColor },
                  ]}
                >
                  <Typography
                    variant="small"
                    color="#fff"
                    style={{ fontWeight: '800' }}
                  >
                    {previewTab === 'offline'
                      ? offlineFormSubmitLabel
                      : formSubmitLabel}
                  </Typography>
                </View>
                {previewTab === 'visitor' && consentRequired ? (
                  <Typography
                    variant="small"
                    style={{ color: '#64748b', marginTop: 8 }}
                  >
                    {consentText}
                  </Typography>
                ) : null}
              </View>
            )}
            <Typography variant="small" muted>
              When offline: {offlineMessage}
            </Typography>
          </View>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() =>
                router.push(
                  withChatEditQuery(
                    '/(dashboard)/chat-widget/add/chat/box',
                    editKey,
                  ) as Href,
                )
              }
              style={styles.footerBtn}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="compact"
              loading={savingNext}
              disabled={savingNext}
              onPress={() => {
                void (async () => {
                  if (savingNext) return;
                  setSavingNext(true);
                  try {
                    const draft = flushToDraft();
                    const widgetKey = resolveRemoteWidgetKeyForChatWizard(
                      editKey,
                      draft,
                    );
                    if (!widgetKey) {
                      Alert.alert(
                        'Missing widget',
                        'Create the widget draft first from Add Widget.',
                      );
                      return;
                    }
                    await patchRemoteWidgetConfiguration({
                      widgetKey,
                      widgetKind: resolveWizardKindFromDraft(draft),
                      draft,
                      publishNow: false,
                      chatWizardPatchScope: 'notifications_only',
                    });
                    router.push(
                      withChatEditQuery(
                        '/(dashboard)/chat-widget/add/chat/script',
                        editKey,
                      ) as Href,
                    );
                  } catch (err) {
                    Alert.alert('Save failed', extractApiErrorMessage(err));
                  } finally {
                    setSavingNext(false);
                  }
                })();
              }}
              style={styles.footerBtn}
            >
              Next: Install
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
  aiCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deptCatalog: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  deptPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowGap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#FB923C55',
    backgroundColor: '#FB923C18',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notifPreview: { gap: 4 },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  siteMock: { gap: 4 },
  siteMockInner: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    padding: 12,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    gap: 8,
  },
  teaserBubble: {
    maxWidth: '80%',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(15,23,42,0.85)',
  },
  fab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
    paddingHorizontal: 3,
  },
  fabBadgeDot: { minWidth: 10, width: 10, height: 10, borderRadius: 5 },
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  formPreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  fakeField: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 10,
  },
  startBtn: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  chatHeader: {
    height: 40,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  chatBody: { gap: 10 },
  chatBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: '90%',
  },
  talkBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footerBtn: { flex: 1 },
});
