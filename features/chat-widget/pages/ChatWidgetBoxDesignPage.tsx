import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { WidgetColorPickerField } from '@/components/dashboard/chat-widget/WidgetColorPickerField';
import {
  AppCard,
  Button,
  InputField,
  SelectField,
  Typography,
} from '@/components/ui';
import { WidgetWizardToggleRow } from '@/features/chat-widget/components/WidgetWizardToggleRow';
import { getWidgetSnapshot } from '@/api/widgets/widgets.api';
import { extractApiErrorMessage } from '@/lib/api/errors';
import {
  AGENT_AVATAR_PRESETS,
  VISITOR_AVATAR_PRESETS,
  findChatAvatarPreset,
  normalizeAgentAvatarPreset,
  normalizeVisitorAvatarPreset,
} from '@/lib/chat-widget/chat-avatar-presets';
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
  WIDGET_LAUNCHER_STYLE_OPTIONS,
  normalizeLauncherStyle,
  normalizePanelSurfaceStyle,
  type WidgetLauncherStyleId,
} from '@/lib/chat-widget/launcher-style';
import { mapWidgetSnapshotToWidgetDraft } from '@/lib/chat-widget/map-widget-snapshot-to-draft';
import { useWizardLauncherChrome } from '@/lib/chat-widget/use-wizard-launcher-preview';
import { WIDGET_GOOGLE_FONT_OPTIONS } from '@/lib/chat-widget/widget-google-fonts';
import {
  deriveWidgetChatColorsDraft,
  readWidgetChatColorsFromDraft,
  widgetChatColorsDraftToPatch,
  type WidgetChatColorsDraft,
} from '@/lib/chat-widget/widget-colors-draft';
import {
  normalizeWidgetInquiryOptions,
  type WidgetInquiryOption,
} from '@/lib/chat-widget/widget-inquiry.types';
import {
  patchRemoteWidgetConfiguration,
  resolveWizardKindFromDraft,
} from '@/lib/chat-widget/widget-remote-sync';
import {
  defaultWidgetDraft,
  type WidgetDraft,
} from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

const STEPS = [
  { n: '01', label: 'LAUNCHER', hint: 'Button design' },
  { n: '02', label: 'PANEL & TOPICS', hint: 'Chat box' },
  { n: '03', label: 'ALERTS & FORMS', hint: 'Notifications' },
  { n: '04', label: 'PUBLISH & EMBED', hint: 'Install' },
] as const;

const PANEL_STYLE_OPTIONS = WIDGET_LAUNCHER_STYLE_OPTIONS.filter(
  (o) => o.id !== 'glow',
);

function parsePx(raw: string, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Widget Customization — Step 2 Chat box (panel, banner, colors, topics, theme).
 * Launcher FAB is owned by Step 1 — shown read-only in preview only.
 * On open: GET snapshot + visitor-topics. On Next: PATCH chat_surface.
 */
export function ChatWidgetBoxDesignPage() {
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
  const [colorsOpen, setColorsOpen] = useState(true);

  const [headerTitleAlign, setHeaderTitleAlign] = useState<'Center' | 'Left'>(
    'Center',
  );
  const [headerTitle, setHeaderTitle] = useState('');
  /** Panel header brand — NOT launcher buttonColor (step 1 owns FAB). */
  const [headerBrandColor, setHeaderBrandColor] = useState('#1E63D5');
  const [headerTextColor, setHeaderTextColor] = useState('#FFFFFF');
  const [headerLogoUri, setHeaderLogoUri] = useState('');
  const [headerLogoHeight, setHeaderLogoHeight] = useState('28');

  const [bannerOn, setBannerOn] = useState(true);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerCtaLabel, setBannerCtaLabel] = useState('Shop now');
  const [bannerCtaHref, setBannerCtaHref] = useState('');
  const [bannerUri, setBannerUri] = useState('');
  const [videoWelcomeOn, setVideoWelcomeOn] = useState(false);

  const [panelStyle, setPanelStyle] =
    useState<WidgetLauncherStyleId>('solid');
  const [panelRadius, setPanelRadius] = useState('12');
  const [bubbleStyle, setBubbleStyle] =
    useState<WidgetLauncherStyleId>('solid');
  const [bubbleShape, setBubbleShape] = useState('rounded');
  const [bubbleRadius, setBubbleRadius] = useState('12');

  const [agentAvatarEnabled, setAgentAvatarEnabled] = useState(true);
  const [visitorAvatarEnabled, setVisitorAvatarEnabled] = useState(true);
  const [agentAvatarPreset, setAgentAvatarPreset] = useState(
    'phosphor-user-circle',
  );
  const [visitorAvatarPreset, setVisitorAvatarPreset] = useState(
    'phosphor-user-circle',
  );

  const [greetingMessage, setGreetingMessage] = useState(
    'Hi! How can we help today?',
  );
  const [sendPlaceholder, setSendPlaceholder] = useState(
    'Type your message…',
  );
  const [panelBackground, setPanelBackground] = useState('#f8fafc');

  const [inquiryOn, setInquiryOn] = useState(false);
  const [inquiryRequired, setInquiryRequired] = useState(false);
  const [inquirySkipLabel, setInquirySkipLabel] = useState('General question');
  const [inquiryOptions, setInquiryOptions] = useState<WidgetInquiryOption[]>(
    [],
  );

  const [chatColors, setChatColors] = useState<WidgetChatColorsDraft>(() =>
    deriveWidgetChatColorsDraft(defaultWidgetDraft),
  );

  const [boxWidth, setBoxWidth] = useState('350');
  const [boxHeight, setBoxHeight] = useState('430');

  const [themeName, setThemeName] = useState('Brand Default');
  const [themeSecondary, setThemeSecondary] = useState('#64748b');
  const [themeFont, setThemeFont] = useState(
    '"Inter", system-ui, sans-serif',
  );
  const [welcomeFont, setWelcomeFont] = useState('18');
  const [bodyFont, setBodyFont] = useState('14');
  const [inputFont, setInputFont] = useState('14');
  const [ctaFont, setCtaFont] = useState('15');
  const [consentFont, setConsentFont] = useState('12');
  const [lineHeight, setLineHeight] = useState('22');
  const [designAccent, setDesignAccent] = useState('blue');
  const [designDensity, setDesignDensity] = useState('comfortable');

  const applyDraftToState = (d: WidgetDraft) => {
    setHeaderTitleAlign(d.headerTitleAlign === 'Left' ? 'Left' : 'Center');
    setHeaderTitle(d.headerTitle ?? '');
    setHeaderBrandColor(
      d.themePrimaryColor?.trim() || d.buttonColor || '#1E63D5',
    );
    setHeaderTextColor(d.textColor || '#FFFFFF');
    setHeaderLogoUri(d.headerLogoDataUrl?.trim() ?? '');
    setHeaderLogoHeight(String(d.headerLogoHeightPx ?? 28));
    setBannerOn(d.bannerOn ?? true);
    setBannerTitle(d.bannerTitle ?? '');
    setBannerCtaLabel(d.bannerCtaLabel?.trim() || 'Shop now');
    setBannerCtaHref(d.bannerCtaHref ?? '');
    setBannerUri(d.bannerDataUrl?.trim() ?? '');
    setVideoWelcomeOn(d.videoWelcomeOn ?? false);
    setPanelStyle(normalizePanelSurfaceStyle(d.panelSurfaceStyle));
    setPanelRadius(String(d.themeBorderRadiusPx ?? 12));
    setBubbleStyle(normalizeLauncherStyle(d.bubbleSurfaceStyle));
    setBubbleShape(d.themeBubbleStyle?.trim() || 'rounded');
    setBubbleRadius(String(d.bubbleBorderRadiusPx ?? 12));
    setAgentAvatarEnabled(d.agentAvatarEnabled !== false);
    setVisitorAvatarEnabled(d.visitorAvatarEnabled !== false);
    setAgentAvatarPreset(normalizeAgentAvatarPreset(d.agentAvatarPreset));
    setVisitorAvatarPreset(normalizeVisitorAvatarPreset(d.visitorAvatarPreset));
    setGreetingMessage(
      d.greetingMessage ?? defaultWidgetDraft.greetingMessage,
    );
    setSendPlaceholder(
      d.sendPlaceholder ?? defaultWidgetDraft.sendPlaceholder,
    );
    setPanelBackground(d.backgroundColor?.trim() || '#f8fafc');
    setInquiryOn(d.inquiryOn === true);
    setInquiryRequired(d.inquiryRequired === true);
    setInquirySkipLabel(
      d.inquirySkipLabel?.trim() ||
        defaultWidgetDraft.inquirySkipLabel ||
        'General question',
    );
    setInquiryOptions(
      normalizeWidgetInquiryOptions(
        d.inquiryOptions ?? defaultWidgetDraft.inquiryOptions,
      ),
    );
    setChatColors(readWidgetChatColorsFromDraft(d));
    setBoxWidth(String(d.boxWidth ?? 350));
    setBoxHeight(String(d.boxHeight ?? 430));
    setThemeName(d.themeName?.trim() || 'Brand Default');
    setThemeSecondary(d.themeSecondaryColor?.trim() || '#64748b');
    setThemeFont(
      d.themeFontFamily?.trim() || '"Inter", system-ui, sans-serif',
    );
    setWelcomeFont(String(d.themeWelcomeFontSizePx ?? 18));
    setBodyFont(String(d.themeBodyFontSizePx ?? 14));
    setInputFont(String(d.themeInputFontSizePx ?? 14));
    setCtaFont(String(d.themeCtaFontSizePx ?? 15));
    setConsentFont(String(d.themeConsentFontSizePx ?? 12));
    setLineHeight(String(d.themeLineHeightPx ?? 22));
    setDesignAccent(d.themeDesignJsonAccent?.trim() || 'blue');
    setDesignDensity(d.themeDesignJsonDensity?.trim() || 'comfortable');
  };

  useEffect(() => {
    if (!draftReady) return;
    void (async () => {
      setHydrating(true);
      try {
        const local = readChatWizardDraft(editKey);
        applyDraftToState(local);
        const widgetKey = resolveRemoteWidgetKeyForChatWizard(editKey, local);
        const websiteId = local.websiteId?.trim() ?? '';

        // Create flow: refresh snapshot once. Edit flow already hydrated on type page.
        if (widgetKey && !editKey) {
          try {
            const snap = await getWidgetSnapshot(widgetKey);
            const mapped = mapWidgetSnapshotToWidgetDraft(snap, widgetKey);
            saveChatWizardDraft(editKey, mapped);
            applyDraftToState({ ...local, ...mapped });
          } catch {
            /* keep local draft if snapshot fails */
          }
        }

        if (websiteId) {
          const topics = await loadInquiryTopicsFromScheduling(websiteId);
          if (topics.length > 0) {
            saveChatWizardDraft(editKey, {
              inquiryOptions: topics,
              inquiryOn: true,
            });
            setInquiryOptions(topics);
            setInquiryOn(true);
          }
        }
      } finally {
        setHydrating(false);
      }
    })();
  }, [draftReady, editKey]);

  const flushToDraft = (): WidgetDraft => {
    const prev = readChatWizardDraft(editKey);
    const patch: Partial<WidgetDraft> = {
      type: prev.type ?? 'chat',
      // Panel / topics only — do not overwrite step-1 launcher FAB fields
      headerTitleAlign,
      headerTitle: headerTitle.trim(),
      themePrimaryColor: headerBrandColor || prev.buttonColor || '#1E63D5',
      textColor: headerTextColor || '#FFFFFF',
      headerLogoDataUrl: headerLogoUri.trim(),
      headerLogoHeightPx: parsePx(headerLogoHeight, 28, 16, 64),
      bannerOn,
      bannerTitle: bannerTitle.trim(),
      bannerCtaLabel: bannerCtaLabel.trim(),
      bannerCtaHref: bannerCtaHref.trim(),
      bannerDataUrl: bannerUri.trim(),
      videoWelcomeOn,
      panelSurfaceStyle: normalizePanelSurfaceStyle(panelStyle),
      themeBorderRadiusPx: parsePx(panelRadius, 12, 0, 20),
      bubbleSurfaceStyle: normalizeLauncherStyle(bubbleStyle),
      themeBubbleStyle: bubbleShape,
      bubbleBorderRadiusPx: parsePx(bubbleRadius, 12, 0, 24),
      agentAvatarEnabled,
      visitorAvatarEnabled,
      agentAvatarPreset: normalizeAgentAvatarPreset(agentAvatarPreset),
      visitorAvatarPreset: normalizeVisitorAvatarPreset(visitorAvatarPreset),
      greetingMessage: greetingMessage.trim(),
      sendPlaceholder: sendPlaceholder.trim(),
      messagePlaceholder: sendPlaceholder.trim(),
      backgroundColor: panelBackground || '#f8fafc',
      inquiryOn,
      inquiryRequired,
      inquirySkipLabel: inquirySkipLabel.trim() || 'General question',
      inquiryOptions: normalizeWidgetInquiryOptions(inquiryOptions),
      ...widgetChatColorsDraftToPatch(chatColors),
      boxWidth: parsePx(boxWidth, 350, 280, 520),
      boxHeight: parsePx(boxHeight, 430, 320, 640),
      themeName: themeName.trim() || 'Brand Default',
      themeSecondaryColor: themeSecondary || '#64748b',
      themeFontFamily: themeFont,
      themeWelcomeFontSizePx: parsePx(welcomeFont, 18, 10, 32),
      themeBodyFontSizePx: parsePx(bodyFont, 14, 10, 28),
      themeInputFontSizePx: parsePx(inputFont, 14, 10, 28),
      themeCtaFontSizePx: parsePx(ctaFont, 15, 10, 28),
      themeConsentFontSizePx: parsePx(consentFont, 12, 10, 24),
      themeLineHeightPx: parsePx(lineHeight, 22, 14, 40),
      themeDesignJsonAccent: designAccent,
      themeDesignJsonDensity: designDensity,
    };
    saveChatWizardDraft(editKey, patch);
    return { ...prev, ...patch };
  };

  const pickImage = async (
    onPicked: (dataUrlOrUri: string) => void,
  ) => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Photo library access is required to upload images.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      onPicked(
        asset.base64
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri,
      );
    } catch (err) {
      Alert.alert('Upload failed', extractApiErrorMessage(err));
    }
  };

  const resetColorsFromBrand = () => {
    const next = deriveWidgetChatColorsDraft({
      buttonColor: launcherChrome.buttonColor || headerBrandColor,
      buttonHoverColor:
        launcherChrome.buttonHoverColor || headerBrandColor,
      iconColor: launcherChrome.iconColor || '#FFFFFF',
      textColor: headerTextColor,
      themeSecondaryColor: themeSecondary,
      backgroundColor: panelBackground,
    });
    setChatColors(next);
  };

  const fontOptions = useMemo(
    () =>
      WIDGET_GOOGLE_FONT_OPTIONS.map((f) => ({
        value: f.value,
        label: f.label,
      })),
    [],
  );

  const alignOptions = useMemo(
    () => [
      { value: 'Center', label: 'Center' },
      { value: 'Left', label: 'Left' },
    ],
    [],
  );

  const bubbleShapeOptions = useMemo(
    () => [
      { value: 'rounded', label: 'Rounded' },
      { value: 'soft', label: 'Soft' },
      { value: 'square', label: 'Square' },
    ],
    [],
  );

  const accentOptions = useMemo(
    () => [
      { value: 'blue', label: 'Blue' },
      { value: 'green', label: 'Green' },
      { value: 'purple', label: 'Purple' },
      { value: 'orange', label: 'Orange' },
    ],
    [],
  );

  const densityOptions = useMemo(
    () => [
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'compact', label: 'Compact' },
      { value: 'spacious', label: 'Spacious' },
    ],
    [],
  );

  const agentPreset = findChatAvatarPreset('agent', agentAvatarPreset);
  const launcherIcon =
    findLauncherIconPreset(launcherChrome.launcherIconPreset)?.ionicon ??
    'chatbubble-outline';
  const launcherColor = launcherChrome.buttonColor || '#1E63D5';
  const launcherLabel =
    chromeDraft.buttonLabel?.trim() || 'Chat with us';
  const showLauncherLabel = chromeDraft.launcherLabelEnabled !== false;
  const showLauncherIcon = chromeDraft.launcherIconEnabled !== false;
  const w = parsePx(boxWidth, 350, 280, 520);
  const h = parsePx(boxHeight, 430, 320, 640);
  const r = parsePx(panelRadius, 12, 0, 20);
  const bubbleR = parsePx(bubbleRadius, 12, 0, 24);

  if (!draftReady || hydrating) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            Loading panel draft…
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

        <DashboardPageIntro subtitle="Open panel layout, messages, banner, topics, and brand styling. Launcher FAB is configured on Step 1." />

        <Typography variant="small" muted>
          Step 2 of 4 — Draft saves on each Next — full publish on Install
          (final step)
        </Typography>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: accent, width: '50%' },
            ]}
 />
        </View>
        <Typography variant="small" muted>
          50% complete
        </Typography>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepRow} showsVerticalScrollIndicator={false}>
          {STEPS.map((step, i) => {
            const active = i === 1;
            const done = i < 1;
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
                  color={
                    active || done ? accent : theme.app.text.muted
                  }
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
            {
              borderColor: `${accent}66`,
              backgroundColor: `${accent}14`,
            },
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
            Chat panel design
          </Typography>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Panel header & banner
          </Typography>
          <SelectField
            label="Header alignment"
            value={headerTitleAlign}
            onChange={(v) =>
              setHeaderTitleAlign(v === 'Left' ? 'Left' : 'Center')
            }
            options={alignOptions}
 />
          <Typography variant="small" muted>
            Center places the logo in the exact middle of the header bar.
          </Typography>
          <WidgetColorPickerField
            label="Header / brand color"
            value={headerBrandColor}
            onChange={setHeaderBrandColor}
 />
          <WidgetColorPickerField
            label="Header text color"
            value={headerTextColor}
            onChange={setHeaderTextColor}
 />
          <InputField
            label="Header title (optional)"
            value={headerTitle}
            onChangeText={setHeaderTitle}
            placeholder="Empty = logo only (no title text)"
 />
          <Typography variant="small" muted>
            Empty = logo only (no title text).
          </Typography>

          <WidgetWizardToggleRow
            label="Show agent name"
            value={Boolean(headerTitle.trim())}
            onChange={(on) => {
              if (on && !headerTitle.trim()) setHeaderTitle('AI Agent');
              if (!on) setHeaderTitle('');
            }}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Header logo (optional)
          </Typography>
          <View style={styles.uploadBox}>
            {headerLogoUri ? (
              <Image
                source={{ uri: headerLogoUri }}
                style={styles.logoPreview}
                resizeMode="contain"
 />
            ) : (
              <Typography variant="small" muted>
                Upload a logo for the chat header
              </Typography>
            )}
            <View style={styles.rowGap}>
              <Button
                size="compact"
                variant="secondary"
                onPress={() => void pickImage(setHeaderLogoUri)}
              >
                Upload logo
              </Button>
              {headerLogoUri ? (
                <Button
                  size="compact"
                  variant="ghost"
                  onPress={() => setHeaderLogoUri('')}
                >
                  Remove
                </Button>
              ) : null}
            </View>
          </View>
          <InputField
            label="Header logo height (px)"
            value={headerLogoHeight}
            onChangeText={setHeaderLogoHeight}
            keyboardType="number-pad"
 />

          <WidgetWizardToggleRow
            label="Banner (optional)"
            value={bannerOn}
            onChange={setBannerOn}
 />
          {bannerOn ? (
            <>
              <InputField
                label="Banner title (optional)"
                value={bannerTitle}
                onChangeText={setBannerTitle}
                placeholder="Shown above the banner media"
 />
              <InputField
                label="Banner CTA label"
                value={bannerCtaLabel}
                onChangeText={setBannerCtaLabel}
 />
              <InputField
                label="Banner CTA link"
                value={bannerCtaHref}
                onChangeText={setBannerCtaHref}
                autoCapitalize="none"
                keyboardType="url"
 />
              <View style={styles.uploadBox}>
                {bannerUri ? (
                  <Image
                    source={{ uri: bannerUri }}
                    style={styles.bannerPreview}
                    resizeMode="cover"
 />
                ) : (
                  <Typography variant="small" muted>
                    Upload banner image (max 10 MB)
                  </Typography>
                )}
                <View style={styles.rowGap}>
                  <Button
                    size="compact"
                    variant="secondary"
                    onPress={() => void pickImage(setBannerUri)}
                  >
                    Upload banner
                  </Button>
                  {bannerUri ? (
                    <Button
                      size="compact"
                      variant="ghost"
                      onPress={() => setBannerUri('')}
                    >
                      Remove
                    </Button>
                  ) : null}
                </View>
              </View>
            </>
          ) : null}
          <WidgetWizardToggleRow
            label="Video welcome"
            value={videoWelcomeOn}
            onChange={setVideoWelcomeOn}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Panel & bubble style
          </Typography>
          <Typography variant="small" muted>
            Panel style
          </Typography>
          <View style={styles.styleRow}>
            {PANEL_STYLE_OPTIONS.map((opt) => {
              const active = panelStyle === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setPanelStyle(opt.id)}
                  style={[
                    styles.styleCard,
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
                    style={{ fontWeight: '700' }}
                    color={active ? accent : undefined}
                  >
                    {opt.label}
                  </Typography>
                  <Typography variant="small" muted>
                    {opt.description}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
          <InputField
            label="Panel corner radius (px)"
            value={panelRadius}
            onChangeText={setPanelRadius}
            keyboardType="number-pad"
 />
          <Typography variant="small" muted>
            Message bubble surface
          </Typography>
          <View style={styles.styleRow}>
            {WIDGET_LAUNCHER_STYLE_OPTIONS.map((opt) => {
              const active = bubbleStyle === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setBubbleStyle(opt.id)}
                  style={[
                    styles.styleCard,
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
                    style={{ fontWeight: '700' }}
                    color={active ? accent : undefined}
                  >
                    {opt.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
          <SelectField
            label="Bubble shape"
            value={bubbleShape}
            onChange={setBubbleShape}
            options={bubbleShapeOptions}
 />
          <InputField
            label="Bubble corner radius (px)"
            value={bubbleRadius}
            onChangeText={setBubbleRadius}
            keyboardType="number-pad"
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Message bubble colors
          </Typography>
          {(
            [
              ['incomingMessageBg', 'Incoming background'],
              ['incomingMessageText', 'Incoming text'],
              ['outgoingMessageBg', 'Outgoing background'],
              ['outgoingMessageText', 'Outgoing text'],
              ['greetingBubbleBg', 'Greeting background'],
              ['greetingBubbleText', 'Greeting text'],
            ] as const
          ).map(([key, label]) => (
            <WidgetColorPickerField
              key={key}
              label={label}
              value={chatColors[key]}
              onChange={(v) =>
                setChatColors((prev) => ({ ...prev, [key]: v }))
              }
 />
          ))}

          <WidgetWizardToggleRow
            label="Agent avatar"
            value={agentAvatarEnabled}
            onChange={setAgentAvatarEnabled}
 />
          {agentAvatarEnabled ? (
            <View style={styles.presetRow}>
              {AGENT_AVATAR_PRESETS.map((p) => {
                const active = agentAvatarPreset === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setAgentAvatarPreset(p.id)}
                    style={[
                      styles.presetChip,
                      {
                        borderColor: active
                          ? headerBrandColor
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: active
                          ? `${headerBrandColor}22`
                          : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={p.ionicon}
                      size={18}
                      color={active ? headerBrandColor : theme.app.text.secondary}
 />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <WidgetWizardToggleRow
            label="Visitor avatar"
            value={visitorAvatarEnabled}
            onChange={setVisitorAvatarEnabled}
 />
          {visitorAvatarEnabled ? (
            <View style={styles.presetRow}>
              {VISITOR_AVATAR_PRESETS.map((p) => {
                const active = visitorAvatarPreset === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setVisitorAvatarPreset(p.id)}
                    style={[
                      styles.presetChip,
                      {
                        borderColor: active
                          ? headerBrandColor
                          : theme.app.dashboard.cardBorder,
                        backgroundColor: active
                          ? `${headerBrandColor}22`
                          : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={p.ionicon}
                      size={18}
                      color={active ? headerBrandColor : theme.app.text.secondary}
 />
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Message flow
          </Typography>
          <Typography variant="small" muted>
            Panel copy only — floating launcher label is set on Step 1.
          </Typography>
          <InputField
            label="Greeting message"
            value={greetingMessage}
            onChangeText={setGreetingMessage}
 />
          <InputField
            label="Message box placeholder"
            value={sendPlaceholder}
            onChangeText={setSendPlaceholder}
 />
          <WidgetColorPickerField
            label="Panel background"
            value={panelBackground}
            onChange={setPanelBackground}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Inquiry topics
          </Typography>
          <WidgetWizardToggleRow
            label="Show inquiry topic pills"
            value={inquiryOn}
            onChange={setInquiryOn}
 />
          {inquiryOn ? (
            <>
              <WidgetWizardToggleRow
                label="Require topic selection"
                value={inquiryRequired}
                onChange={setInquiryRequired}
 />
              <InputField
                label="Skip label"
                value={inquirySkipLabel}
                onChangeText={setInquirySkipLabel}
                placeholder="General question"
 />
              <View style={styles.topicList}>
                {inquiryOptions.length === 0 ? (
                  <Typography variant="small" muted>
                    No topics loaded yet — they come from visitor-topics for
                    this website.
                  </Typography>
                ) : (
                  inquiryOptions.map((t) => (
                    <View
                      key={`${t.routingKey}-${t.label}`}
                      style={[
                        styles.topicPill,
                        {
                          backgroundColor:
                            chatColors.inquiryPillBg || '#f8fafc',
                          borderColor:
                            chatColors.inquiryPillBorder || '#909cad',
                        },
                      ]}
                    >
                      <Typography
                        variant="small"
                        color={chatColors.inquiryPillText || '#0f172a'}
                        style={{ fontWeight: '600' }}
                      >
                        {t.label}
                      </Typography>
                    </View>
                  ))
                )}
              </View>
            </>
          ) : null}

          <View style={styles.colorsHeader}>
            <View style={{ flex: 1 }}>
              <Typography variant="medium" style={{ fontWeight: '700' }}>
                Chat colors & typography
              </Typography>
              <Typography variant="small" muted>
                Panel color tokens and size.
              </Typography>
            </View>
            <Button
              size="compact"
              variant="ghost"
              onPress={() => setColorsOpen((v) => !v)}
            >
              {colorsOpen ? 'Collapse' : 'Expand'}
            </Button>
          </View>
          <Button
            size="compact"
            variant="secondary"
            onPress={resetColorsFromBrand}
          >
            Reset from brand colors
          </Button>
          {colorsOpen
            ? (
                [
                  ['chatBodyText', 'Body text'],
                  ['chatMutedText', 'Muted text'],
                  ['labelColor', 'Field label'],
                  ['inputBackground', 'Input background'],
                  ['inputText', 'Input text'],
                  ['inputBorderColor', 'Input border'],
                  ['inputPlaceholderColor', 'Placeholder text'],
                  ['inquiryPillBg', 'Idle pill background'],
                  ['inquiryPillText', 'Idle pill text'],
                  ['inquiryPillBorder', 'Idle pill border'],
                  ['inquiryPillSelectedBg', 'Selected pill background'],
                  ['inquiryPillSelectedText', 'Selected pill text'],
                  ['talkToAgentButtonBg', 'Talk to agent background'],
                  ['talkToAgentButtonText', 'Talk to agent text'],
                  ['talkToAgentButtonBorder', 'Talk to agent border'],
                ] as const
              ).map(([key, label]) => (
                <WidgetColorPickerField
                  key={key}
                  label={label}
                  value={chatColors[key]}
                  onChange={(v) =>
                    setChatColors((prev) => ({ ...prev, [key]: v }))
                  }
 />
              ))
            : null}

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Panel size
          </Typography>
          <View style={styles.insetRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Panel width (px)"
                value={boxWidth}
                onChangeText={setBoxWidth}
                keyboardType="number-pad"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Panel height (px)"
                value={boxHeight}
                onChangeText={setBoxHeight}
                keyboardType="number-pad"
 />
            </View>
          </View>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Brand theme
          </Typography>
          <Typography variant="small" muted>
            Fonts, spacing, and density for the open panel.
          </Typography>
          <InputField
            label="Theme name"
            value={themeName}
            onChangeText={setThemeName}
 />
          <WidgetColorPickerField
            label="Secondary color"
            value={themeSecondary}
            onChange={setThemeSecondary}
 />
          <SelectField
            label="Font family"
            value={themeFont}
            onChange={setThemeFont}
            options={fontOptions}
 />
          <View style={styles.insetRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Welcome font size (px)"
                value={welcomeFont}
                onChangeText={setWelcomeFont}
                keyboardType="number-pad"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Body font size (px)"
                value={bodyFont}
                onChangeText={setBodyFont}
                keyboardType="number-pad"
 />
            </View>
          </View>
          <View style={styles.insetRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Input font size (px)"
                value={inputFont}
                onChangeText={setInputFont}
                keyboardType="number-pad"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="CTA font size (px)"
                value={ctaFont}
                onChangeText={setCtaFont}
                keyboardType="number-pad"
 />
            </View>
          </View>
          <View style={styles.insetRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Consent font size (px)"
                value={consentFont}
                onChangeText={setConsentFont}
                keyboardType="number-pad"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Line height (px)"
                value={lineHeight}
                onChangeText={setLineHeight}
                keyboardType="number-pad"
 />
            </View>
          </View>
          <SelectField
            label="Design accent"
            value={designAccent}
            onChange={setDesignAccent}
            options={accentOptions}
 />
          <SelectField
            label="Design density"
            value={designDensity}
            onChange={setDesignDensity}
            options={densityOptions}
 />

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
            <Typography variant="small" muted>
              Panel design updates live here. Launcher FAB is from Step 1
              (read-only).
            </Typography>

            <View style={styles.launcherPreviewStage}>
              <Typography
                variant="small"
                muted
                style={{ alignSelf: 'flex-start', marginBottom: 6 }}
              >
                Launcher (Step 1)
              </Typography>
              <View
                style={[
                  styles.launcherPill,
                  { backgroundColor: launcherColor },
                ]}
              >
                {showLauncherIcon ? (
                  <Ionicons name={launcherIcon} size={18} color="#fff" />
                ) : null}
                {showLauncherLabel ? (
                  <Typography
                    variant="small"
                    color="#FFFFFF"
                    style={{ fontWeight: '700' }}
                  >
                    {launcherLabel}
                  </Typography>
                ) : null}
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: launcherColor },
                  ]}
                >
                  <Typography
                    variant="small"
                    color="#FFFFFF"
                    style={{ fontWeight: '800', fontSize: 10 }}
                  >
                    1
                  </Typography>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.panelPreview,
                {
                  width: Math.min(w, 320),
                  height: Math.min(h, 400),
                  borderRadius: r,
                  backgroundColor: panelBackground,
                  borderWidth: panelStyle === 'glass' ? 1 : StyleSheet.hairlineWidth,
                  borderColor:
                    panelStyle === 'glass'
                      ? 'rgba(255,255,255,0.55)'
                      : 'rgba(15,23,42,0.12)',
                },
              ]}
            >
              {panelStyle === 'gradient' ? (
                <LinearGradient
                  colors={[
                    headerBrandColor,
                    launcherChrome.buttonHoverColor || headerBrandColor,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFillObject, { opacity: 0.12 }]}
 />
              ) : null}
              {panelStyle === 'glass' ? (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: 'rgba(255,255,255,0.22)' },
                  ]}
 />
              ) : null}

              <View
                style={[
                  styles.panelHeader,
                  { backgroundColor: headerBrandColor },
                ]}
              >
                {headerLogoUri ? (
                  <Image
                    source={{ uri: headerLogoUri }}
                    style={{
                      width: parsePx(headerLogoHeight, 28, 16, 64),
                      height: parsePx(headerLogoHeight, 28, 16, 64),
                      borderRadius: 4,
                    }}
                    resizeMode="contain"
 />
                ) : null}
                <Typography
                  variant="small"
                  color={headerTextColor}
                  style={{
                    fontWeight: '700',
                    flex: 1,
                    textAlign:
                      headerTitleAlign === 'Center' ? 'center' : 'left',
                  }}
                >
                  {headerTitle.trim() || 'AI Agent'}
                </Typography>
                <Ionicons
                  name="ellipsis-vertical"
                  size={16}
                  color={headerTextColor}
 />
                <Ionicons name="close" size={18} color={headerTextColor} />
              </View>

              {bannerOn && (bannerUri || bannerTitle.trim()) ? (
                <View style={styles.bannerSlot}>
                  {bannerUri ? (
                    <Image
                      source={{ uri: bannerUri }}
                      style={styles.bannerInPanel}
                      resizeMode="cover"
 />
                  ) : null}
                  {bannerTitle.trim() ? (
                    <Typography
                      variant="small"
                      style={{ fontWeight: '700', paddingHorizontal: 10 }}
                    >
                      {bannerTitle.trim()}
                    </Typography>
                  ) : null}
                  {bannerCtaLabel.trim() ? (
                    <Typography
                      variant="small"
                      color={headerBrandColor}
                      style={{
                        fontWeight: '700',
                        paddingHorizontal: 10,
                        paddingBottom: 8,
                      }}
                    >
                      {bannerCtaLabel.trim()}
                    </Typography>
                  ) : null}
                </View>
              ) : null}

              <View style={styles.panelBody}>
                {inquiryOn && inquiryOptions.length > 0 ? (
                  <View style={styles.topicPreviewRow}>
                    {inquiryOptions.slice(0, 3).map((t) => (
                      <View
                        key={`prev-${t.routingKey}`}
                        style={[
                          styles.topicPill,
                          {
                            backgroundColor:
                              chatColors.inquiryPillBg || '#f8fafc',
                            borderColor:
                              chatColors.inquiryPillBorder || '#909cad',
                          },
                        ]}
                      >
                        <Typography
                          variant="small"
                          color={chatColors.inquiryPillText || '#0f172a'}
                          style={{ fontSize: 11, fontWeight: '600' }}
                        >
                          {t.label}
                        </Typography>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.msgRow}>
                  {agentAvatarEnabled ? (
                    <View
                      style={[
                        styles.msgAvatar,
                        { backgroundColor: headerBrandColor },
                      ]}
                    >
                      <Ionicons
                        name={agentPreset.ionicon}
                        size={14}
                        color="#fff"
 />
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.msgBubble,
                      {
                        backgroundColor:
                          chatColors.greetingBubbleBg ||
                          chatColors.incomingMessageBg ||
                          '#d7dde3',
                        borderRadius: bubbleR,
                        opacity: bubbleStyle === 'glass' ? 0.92 : 1,
                        shadowColor:
                          bubbleStyle === 'glow'
                            ? headerBrandColor
                            : 'transparent',
                        shadowOpacity: bubbleStyle === 'glow' ? 0.35 : 0,
                        shadowRadius: bubbleStyle === 'glow' ? 8 : 0,
                      },
                    ]}
                  >
                    <Typography
                      variant="small"
                      color={
                        chatColors.greetingBubbleText ||
                        chatColors.incomingMessageText ||
                        '#0f172a'
                      }
                    >
                      {greetingMessage.trim() ||
                        'Hi! How can we help today?'}
                    </Typography>
                  </View>
                </View>
                <View style={styles.composerRow}>
                  <View
                    style={[
                      styles.composerInput,
                      {
                        backgroundColor:
                          chatColors.inputBackground || '#fff',
                        borderColor:
                          chatColors.inputBorderColor || '#cbd5e1',
                      },
                    ]}
                  >
                    <Typography
                      variant="small"
                      color={
                        chatColors.inputPlaceholderColor || '#94a3b8'
                      }
                    >
                      {sendPlaceholder.trim() || 'Type your message…'}
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.sendBtn,
                      { backgroundColor: headerBrandColor },
                    ]}
                  >
                    <Ionicons name="send" size={14} color="#fff" />
                  </View>
                </View>
                <View
                  style={[
                    styles.talkBtn,
                    {
                      borderColor:
                        chatColors.talkToAgentButtonBorder ||
                        headerBrandColor,
                      backgroundColor:
                        chatColors.talkToAgentButtonBg || '#f8fafc',
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    color={
                      chatColors.talkToAgentButtonText || headerBrandColor
                    }
                    style={{ fontWeight: '700' }}
                  >
                    Talk to agent
                  </Typography>
                </View>
              </View>
            </View>
            <Typography variant="small" muted>
              {w}×{h}px · panel {panelStyle} · bubbles {bubbleStyle}
            </Typography>
          </View>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() =>
                router.push(
                  withChatEditQuery(
                    '/(dashboard)/chat-widget/add/chat/button',
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
                      chatWizardPatchScope: 'chat_surface',
                    });
                    router.push(
                      withChatEditQuery(
                        '/(dashboard)/chat-widget/add/chat/notifications',
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
              Next
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
  infoBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(148,163,184,0.45)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  logoPreview: { width: 72, height: 40 },
  bannerPreview: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  rowGap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: '30%',
    flexGrow: 1,
    gap: 2,
  },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insetRow: { flexDirection: 'row', gap: 10 },
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
  launcherPreviewStage: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'flex-end',
    overflow: 'visible',
  },
  launcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 999,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  panelPreview: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(15,23,42,0.12)',
  },
  panelHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  bannerSlot: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(15,23,42,0.08)',
    gap: 4,
    paddingTop: 0,
  },
  bannerInPanel: {
    width: '100%',
    height: 72,
  },
  panelBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-end',
    gap: 10,
  },
  topicList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  topicPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
