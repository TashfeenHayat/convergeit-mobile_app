import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { MobileScreen } from '@/components/layout';
import { DashboardPageIntro } from '@/components/layout/DashboardPageIntro';
import { WidgetColorPickerField } from '@/components/dashboard/chat-widget/WidgetColorPickerField';
import { WidgetLauncherIconPicker } from '@/components/dashboard/chat-widget/WidgetLauncherIconPicker';
import {
  AppCard,
  Button,
  InputField,
  SelectField,
  Typography,
} from '@/components/ui';
import { WidgetWizardToggleRow } from '@/features/chat-widget/components/WidgetWizardToggleRow';
import { extractApiErrorMessage } from '@/lib/api/errors';
import { WIDGET_BRAND_COLOR_PRESETS } from '@/lib/chat-widget/brand-color-presets';
import {
  readChatWizardDraft,
  resolveRemoteWidgetKeyForChatWizard,
  saveChatWizardDraft,
  useChatWidgetWizardEdit,
  withChatEditQuery,
} from '@/lib/chat-widget/chat-wizard-edit';
import type { LauncherIconPresetId } from '@/lib/chat-widget/launcher-icon-presets';
import { findLauncherIconPreset } from '@/lib/chat-widget/launcher-icon-presets';
import {
  WIDGET_LAUNCHER_STYLE_OPTIONS,
  launcherShapeRadius,
  type WidgetLauncherStyleId,
} from '@/lib/chat-widget/launcher-style';
import {
  patchRemoteWidgetConfiguration,
  resolveWizardKindFromDraft,
} from '@/lib/chat-widget/widget-remote-sync';
import {
  defaultWidgetDraft,
  type WidgetDraft,
} from '@/lib/chat-widget/widgetDraft';
import { useAppTheme } from '@/theme';

function parseInsetPxString(raw: string, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(480, Math.max(0, n));
}

function darkenHex(hex: string, factor = 0.72): string {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) return hex;
  const to = (i: number) =>
    Math.max(0, Math.min(255, Math.round(Number.parseInt(h.slice(i, i + 2), 16) * factor)))
      .toString(16)
      .padStart(2, '0');
  return `#${to(0)}${to(2)}${to(4)}`;
}

/** Lighten hex for glass top sheen gradient. */
function lightenHex(hex: string, mix = 0.28): string {
  const h = hex.trim().replace('#', '');
  if (h.length !== 6) return hex;
  const to = (i: number) => {
    const c = Number.parseInt(h.slice(i, i + 2), 16);
    return Math.round(c + (255 - c) * mix)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${to(0)}${to(2)}${to(4)}`;
}

type PreviewLauncherProps = {
  styleId: WidgetLauncherStyleId;
  buttonColor: string;
  hoverColor: string;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconEnabled: boolean;
  labelEnabled: boolean;
  label: string;
  borderRadius: number;
  isPill: boolean;
  align: 'flex-start' | 'flex-end';
};

function PreviewLauncherButton({
  styleId,
  buttonColor,
  hoverColor,
  iconColor,
  iconName,
  iconEnabled,
  labelEnabled,
  label,
  borderRadius,
  isPill,
  align,
}: PreviewLauncherProps) {
  const base = buttonColor || '#1E63D5';
  const hover = hoverColor || base;
  const r = isPill ? 999 : borderRadius;

  const shellLayout: ViewStyle = {
    borderRadius: r,
    paddingHorizontal: isPill ? 14 : 0,
    width: isPill ? undefined : 56,
    height: 56,
    overflow: 'hidden',
    position: 'relative',
  };

  const content = (
    <View style={styles.launcherInner}>
      {iconEnabled ? (
        <Ionicons name={iconName} size={22} color={iconColor} />
      ) : null}
      {labelEnabled ? (
        <Typography
          variant="medium"
          color={iconColor}
          style={{ fontWeight: '700' }}
        >
          {label}
        </Typography>
      ) : null}
    </View>
  );

  const wrap = (shell: ReactNode, badgeTint: string) => (
    <View style={[styles.previewLauncherWrap, { alignSelf: align }]}>
      {shell}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: badgeTint,
            shadowColor: badgeTint,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.65,
            shadowRadius: 6,
            elevation: 4,
          },
        ]}
      >
        <Typography
          variant="small"
          color="#FFFFFF"
          style={{ fontWeight: '800', fontSize: 10, lineHeight: 12 }}
        >
          1
        </Typography>
      </View>
    </View>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Launcher preview — press for hover color"
      style={({ pressed }) => [{ transform: [{ scale: pressed ? 1.03 : 1 }] }]}
    >
      {({ pressed }) => {
        const badgeTint = pressed ? hover : base;

        if (styleId === 'gradient') {
          return wrap(
            <LinearGradient
              colors={pressed ? [hover, base] : [base, hover]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                shellLayout,
                {
                  shadowColor: hover,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
            >
              {content}
            </LinearGradient>,
            badgeTint,
          );
        }

        if (styleId === 'glass') {
          const tint = pressed ? hover : base;
          const topTint = lightenHex(tint, 0.22);
          const bottomTint = darkenHex(tint, 0.88);
          return wrap(
            <View
              style={[
                {
                  borderRadius: r,
                  // Shadow on outer wrap so it isn't clipped
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.22,
                  shadowRadius: 14,
                  elevation: 8,
                },
              ]}
            >
              <View
                style={[
                  shellLayout,
                  {
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.55)',
                    backgroundColor: tint,
                  },
                ]}
              >
                {/* Soft glass body: lighter top → richer bottom */}
                <LinearGradient
                  colors={[topTint, tint, bottomTint]}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
 />
                {/* Frosted glass veil (keeps color, adds translucency feel) */}
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: 'rgba(255,255,255,0.18)' },
                  ]}
 />
                {/* Top rim sheen — glassy edge */}
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0.7)',
                    'rgba(255,255,255,0.15)',
                    'rgba(255,255,255,0)',
                  ]}
                  locations={[0, 0.35, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 22,
                  }}
 />
                {/* Soft bottom shade for depth */}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 18,
                  }}
 />
                {content}
              </View>
            </View>,
            darkenHex(tint, 0.7),
          );
        }

        if (styleId === 'glow') {
          const glowColor = pressed ? hover : base;
          return wrap(
            <View
              style={[
                styles.launcherBtn,
                {
                  borderRadius: r,
                  paddingHorizontal: isPill ? 14 : 0,
                  width: isPill ? undefined : 56,
                  height: 56,
                  backgroundColor: glowColor,
                  shadowColor: glowColor,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.45,
                  shadowRadius: 16,
                  elevation: 12,
                },
              ]}
            >
              {content}
            </View>,
            badgeTint,
          );
        }

        // solid
        return wrap(
          <View
            style={[
              shellLayout,
              {
                backgroundColor: pressed ? hover : base,
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            {content}
          </View>,
          badgeTint,
        );
      }}
    </Pressable>
  );
}

const STEPS = [
  { n: '01', label: 'LAUNCHER', hint: 'Button design' },
  { n: '02', label: 'PANEL & TOPICS', hint: 'Chat box' },
  { n: '03', label: 'ALERTS & FORMS', hint: 'Notifications' },
  { n: '04', label: 'PUBLISH & EMBED', hint: 'Install' },
] as const;

/**
 * Widget Customization — Step 1 Launcher (chat button design).
 * Opened after POST /widgets/installations + GET visitor-topics from type selection Next.
 */
export function ChatWidgetButtonDesignPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { editWidgetKey, isEdit, draftReady, hydrateError } =
    useChatWidgetWizardEdit();
  const editKey = editWidgetKey || null;

  const [buttonShape, setButtonShape] = useState<
    'circle' | 'rounded' | 'square'
  >('circle');
  const [buttonPosition, setButtonPosition] = useState<'left' | 'right'>(
    'right',
  );
  const [selectedButtonColor, setSelectedButtonColor] = useState('#1E63D5');
  const [selectedHoverColor, setSelectedHoverColor] = useState('#164EB0');
  const [selectedIconColor, setSelectedIconColor] = useState('#FFFFFF');
  const [launcherIconPreset, setLauncherIconPreset] =
    useState<LauncherIconPresetId>('phosphor-chat-circle');
  const [launcherIconEnabled, setLauncherIconEnabled] = useState(true);
  const [launcherLabelEnabled, setLauncherLabelEnabled] = useState(true);
  const [buttonLabel, setButtonLabel] = useState('Chat with us');
  const [launcherStyle, setLauncherStyle] =
    useState<WidgetLauncherStyleId>('solid');
  const [launcherInsetBottom, setLauncherInsetBottom] = useState('28');
  const [launcherInsetSide, setLauncherInsetSide] = useState('28');
  const [proactiveTeaserEnabled, setProactiveTeaserEnabled] = useState(true);
  const [proactiveTeaser, setProactiveTeaser] = useState(
    'Any questions? Let us know!',
  );
  const [proactiveAvatarEnabled, setProactiveAvatarEnabled] = useState(false);
  const [proactiveAvatarUri, setProactiveAvatarUri] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [proactiveSecondaryCtaEnabled, setProactiveSecondaryCtaEnabled] =
    useState(false);
  const [closedMessagePreviewEnabled, setClosedMessagePreviewEnabled] =
    useState(true);
  const [savingNext, setSavingNext] = useState(false);

  useEffect(() => {
    if (!draftReady) return;
    const d = readChatWizardDraft(editKey);
    setButtonShape(d.buttonShape ?? 'circle');
    setButtonPosition(d.buttonPosition === 'left' ? 'left' : 'right');
    setSelectedButtonColor(d.buttonColor || '#1E63D5');
    setSelectedHoverColor(d.buttonHoverColor || '#164EB0');
    setSelectedIconColor(d.iconColor || '#FFFFFF');
    setLauncherIconPreset(
      (d.launcherIconPreset as LauncherIconPresetId) ||
        'phosphor-chat-circle',
    );
    setLauncherIconEnabled(d.launcherIconEnabled !== false);
    setLauncherLabelEnabled(d.launcherLabelEnabled !== false);
    setButtonLabel(d.buttonLabel ?? defaultWidgetDraft.buttonLabel ?? 'Chat with us');
    setLauncherStyle((d.launcherStyle as WidgetLauncherStyleId) || 'solid');
    setLauncherInsetBottom(String(d.launcherInsetBottomPx ?? 28));
    setLauncherInsetSide(String(d.launcherInsetSidePx ?? 28));
    setProactiveTeaserEnabled(d.proactiveTeaserEnabled ?? true);
    setProactiveTeaser(
      d.proactiveTeaser ??
        defaultWidgetDraft.proactiveTeaser ??
        'Any questions? Let us know!',
    );
    setProactiveAvatarEnabled(d.proactiveTeaserAvatarEnabled ?? false);
    setProactiveAvatarUri(d.proactiveTeaserAvatarDataUrl?.trim() ?? '');
    setProactiveSecondaryCtaEnabled(d.proactiveSecondaryCtaEnabled ?? false);
    setClosedMessagePreviewEnabled(d.closedMessagePreviewEnabled !== false);
  }, [draftReady, editKey]);

  const flushToDraft = (): WidgetDraft => {
    const prev = readChatWizardDraft(editKey);
    const patch: Partial<WidgetDraft> = {
      type: prev.type ?? 'chat',
      buttonShape,
      buttonPosition,
      launcherInsetBottomPx: parseInsetPxString(launcherInsetBottom, 28),
      launcherInsetSidePx: parseInsetPxString(launcherInsetSide, 28),
      buttonColor: selectedButtonColor || '#1E63D5',
      buttonHoverColor: selectedHoverColor || '#164EB0',
      iconColor: selectedIconColor || '#FFFFFF',
      launcherIconPreset,
      launcherIconEnabled,
      launcherLabelEnabled,
      buttonLabel: buttonLabel.trim(),
      launcherStyle,
      proactiveTeaserEnabled,
      proactiveTeaser: proactiveTeaser.trim(),
      proactiveTeaserAvatarEnabled: proactiveAvatarEnabled,
      proactiveTeaserAvatarDataUrl: proactiveAvatarEnabled
        ? proactiveAvatarUri.trim()
        : '',
      proactiveSecondaryCtaEnabled,
      closedMessagePreviewEnabled,
    };
    saveChatWizardDraft(editKey, patch);
    return { ...prev, ...patch };
  };

  const pickAgentAvatar = async () => {
    if (avatarUploading) return;
    setAvatarUploading(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Photo library access is required to upload an agent avatar.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const next =
        asset.base64 != null && asset.base64.length > 0
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;
      setProactiveAvatarUri(next);
      setProactiveAvatarEnabled(true);
    } catch (err) {
      Alert.alert('Upload failed', extractApiErrorMessage(err));
    } finally {
      setAvatarUploading(false);
    }
  };

  const radius = launcherShapeRadius(buttonShape);
  const previewIsPill = buttonShape !== 'circle' || launcherLabelEnabled;
  const previewIconName =
    findLauncherIconPreset(launcherIconPreset)?.ionicon ?? 'chatbubble-outline';
  const insetBottomPx = parseInsetPxString(launcherInsetBottom, 28);
  const insetSidePx = parseInsetPxString(launcherInsetSide, 28);

  const positionOptions = useMemo(
    () => [
      { value: 'right', label: 'Right' },
      { value: 'left', label: 'Left' },
    ],
    [],
  );

  if (!draftReady) {
    return (
      <MobileScreen scroll={false} contentStyle={styles.screen}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={accent} />
          <Typography variant="small" muted>
            {isEdit ? 'Loading widget draft…' : 'Loading…'}
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

        <DashboardPageIntro subtitle="Shape, colors, and position of the floating chat launcher." />

        <Typography variant="small" muted>
          Step 1 of 4 — Draft saves on each Next — full publish on Install
          (final step)
        </Typography>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: accent, width: '25%' }]} />
        </View>
        <Typography variant="small" muted>
          25% complete
        </Typography>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stepRow} showsVerticalScrollIndicator={false}>
          {STEPS.map((step, i) => {
            const active = i === 0;
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
                  color={active ? accent : theme.app.text.muted}
                  style={{ fontWeight: '800' }}
                >
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
            styles.infoBanner,
            {
              borderColor: `${accent}66`,
              backgroundColor: `${accent}18`,
            },
          ]}
        >
          <Ionicons name="information-circle-outline" size={18} color={accent} />
          <Typography variant="small" style={{ flex: 1, lineHeight: 18 }}>
            Working draft — each step saves with PATCH. Real sites show the
            widget only after you click Go live. Use the test link to preview
            anytime.
          </Typography>
        </View>

        <AppCard style={{ gap: 14 }}>
          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Launcher design
          </Typography>
          <Typography variant="small" muted>
            Step 1 of 4
          </Typography>
          <Typography variant="small" muted>
            Shape, colors, icon, and screen position. Invitation bubble
            (optional). WhatsApp button (optional). Live message preview.
            Typography and panel theme are on Chat Box Design (step 2).
          </Typography>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Colors & launcher style
          </Typography>
          <Typography variant="small" muted>
            Button, hover, and icon colors plus surface style (solid, gradient,
            glass, glow).
          </Typography>

          <WidgetColorPickerField
            label="Button color"
            value={selectedButtonColor}
            onChange={setSelectedButtonColor}
 />
          <WidgetColorPickerField
            label="Hover color"
            value={selectedHoverColor}
            onChange={setSelectedHoverColor}
 />
          <WidgetColorPickerField
            label="Icon color"
            value={selectedIconColor}
            onChange={setSelectedIconColor}
 />

          <Typography variant="small" muted style={{ fontWeight: '700' }}>
            Brand presets
          </Typography>
          <View style={styles.presetRow}>
            {WIDGET_BRAND_COLOR_PRESETS.map((p) => {
              const active =
                selectedButtonColor.toLowerCase() ===
                p.buttonColor.toLowerCase();
              return (
                <Pressable
                  key={p.id}
                  onPress={() => {
                    setSelectedButtonColor(p.buttonColor);
                    setSelectedHoverColor(p.buttonHoverColor);
                    setSelectedIconColor(p.iconColor);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: active
                        ? accent
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: active
                        ? `${accent}22`
                        : theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.presetDot,
                      { backgroundColor: p.buttonColor },
                    ]}
 />
                  <Typography variant="small" style={{ fontWeight: '600' }}>
                    {p.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Launcher style
          </Typography>
          <View style={styles.styleGrid}>
            {WIDGET_LAUNCHER_STYLE_OPTIONS.map((opt) => {
              const active = launcherStyle === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setLauncherStyle(opt.id)}
                  style={[
                    styles.styleCard,
                    {
                      borderColor: active
                        ? accent
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: active
                        ? `${accent}22`
                        : theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <Typography variant="medium" style={{ fontWeight: '700' }}>
                    {opt.label}
                  </Typography>
                  <Typography variant="small" muted>
                    {opt.description}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <WidgetWizardToggleRow
            label="Launcher icon"
            value={launcherIconEnabled}
            onChange={setLauncherIconEnabled}
 />
          {launcherIconEnabled ? (
            <WidgetLauncherIconPicker
              value={launcherIconPreset}
              onChange={setLauncherIconPreset}
              accentColor={selectedButtonColor}
 />
          ) : null}

          <WidgetWizardToggleRow
            label="Button label"
            description="Turn off to hide text on the launcher — visitors see the icon and shape only."
            value={launcherLabelEnabled}
            onChange={setLauncherLabelEnabled}
 />
          {launcherLabelEnabled ? (
            <InputField
              label="Launcher button text"
              value={buttonLabel}
              onChangeText={setButtonLabel}
              placeholder="Chat with us"
 />
          ) : null}

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Launcher shape & position
          </Typography>
          <Typography variant="small" muted>
            Button shape
          </Typography>
          <View style={styles.shapeRow}>
            {(
              [
                { id: 'circle' as const, icon: 'ellipse-outline' as const },
                { id: 'rounded' as const, icon: 'tablet-landscape-outline' as const },
                { id: 'square' as const, icon: 'square-outline' as const },
              ] as const
            ).map((s) => {
              const active = buttonShape === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setButtonShape(s.id)}
                  style={[
                    styles.shapeBtn,
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
                  <Ionicons
                    name={s.icon}
                    size={22}
                    color={active ? accent : theme.app.text.secondary}
 />
                </Pressable>
              );
            })}
          </View>

          <View
            style={[
              styles.nestedCard,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <WidgetWizardToggleRow
              label="Show invitation bubble"
              value={proactiveTeaserEnabled}
              onChange={setProactiveTeaserEnabled}
 />
            {proactiveTeaserEnabled ? (
              <InputField
                label="Invitation message"
                value={proactiveTeaser}
                onChangeText={setProactiveTeaser}
                placeholder="Any questions? Let us know!"
 />
            ) : null}
            <WidgetWizardToggleRow
              label="Show agent avatar"
              value={proactiveAvatarEnabled}
              onChange={setProactiveAvatarEnabled}
 />
            {proactiveAvatarEnabled ? (
              <View style={styles.avatarUploadRow}>
                {proactiveAvatarUri ? (
                  <Image
                    source={{ uri: proactiveAvatarUri }}
                    style={styles.avatarThumb}
 />
                ) : null}
                <Button
                  variant="secondary"
                  size="compact"
                  loading={avatarUploading}
                  onPress={() => void pickAgentAvatar()}
                  style={styles.avatarUploadBtn}
                >
                  Upload agent avatar
                </Button>
                {proactiveAvatarUri ? (
                  <Button
                    variant="ghost"
                    size="compact"
                    disabled={avatarUploading}
                    onPress={() => setProactiveAvatarUri('')}
                  >
                    Remove
                  </Button>
                ) : null}
              </View>
            ) : null}
            <WidgetWizardToggleRow
              label="WhatsApp button"
              description="Second action that opens WhatsApp in a new tab."
              value={proactiveSecondaryCtaEnabled}
              onChange={setProactiveSecondaryCtaEnabled}
 />
          </View>

          <View
            style={[
              styles.nestedCard,
              { borderColor: theme.app.dashboard.cardBorder },
            ]}
          >
            <WidgetWizardToggleRow
              label="Live message preview"
              description="When an agent replies while chat is closed, their message replaces the invitation bubble."
              value={closedMessagePreviewEnabled}
              onChange={setClosedMessagePreviewEnabled}
 />
            <Typography variant="small" muted>
              Unread badge style is configured on the Notifications step.
            </Typography>
          </View>

          <SelectField
            label="Button Position"
            value={buttonPosition}
            onChange={(v) =>
              setButtonPosition(v === 'left' ? 'left' : 'right')
            }
            options={positionOptions}
 />

          <Typography variant="medium" style={{ fontWeight: '700' }}>
            Launcher position (fine tune)
          </Typography>
          <Typography variant="small" muted>
            Bottom inset moves the launcher up from the screen edge. Side inset
            controls spacing from the left or right corner.
          </Typography>
          <View style={styles.insetRow}>
            <View style={{ flex: 1 }}>
              <InputField
                label="Inset from bottom (px)"
                value={launcherInsetBottom}
                onChangeText={setLauncherInsetBottom}
                keyboardType="number-pad"
 />
            </View>
            <View style={{ flex: 1 }}>
              <InputField
                label="Inset from side (px)"
                value={launcherInsetSide}
                onChangeText={setLauncherInsetSide}
                keyboardType="number-pad"
 />
            </View>
          </View>

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
              Edits update customer sites only after publishing on the Install
              step.
            </Typography>
            <View
              style={[
                styles.previewStage,
                {
                  paddingBottom: Math.max(12, insetBottomPx),
                  paddingLeft:
                    buttonPosition === 'left'
                      ? Math.max(12, insetSidePx)
                      : 28,
                  paddingRight:
                    buttonPosition === 'right'
                      ? Math.max(12, insetSidePx)
                      : 28,
                },
              ]}
            >
              <Typography
                variant="small"
                muted
                style={{ marginBottom: 8, alignSelf: 'flex-start' }}
              >
                Style uses button + hover colors · press to preview hover ·
                insets {insetBottomPx}/{insetSidePx}px
              </Typography>
              {proactiveTeaserEnabled ? (
                <View
                  style={[
                    styles.teaserBubble,
                    {
                      alignSelf:
                        buttonPosition === 'left' ? 'flex-start' : 'flex-end',
                      borderColor: theme.app.dashboard.cardBorder,
                    },
                  ]}
                >
                  {proactiveAvatarEnabled ? (
                    proactiveAvatarUri ? (
                      <Image
                        source={{ uri: proactiveAvatarUri }}
                        style={styles.teaserAvatar}
 />
                    ) : (
                      <View style={[styles.teaserAvatar, styles.teaserAvatarFallback]}>
                        <Ionicons
                          name="person"
                          size={16}
                          color={theme.app.text.secondary}
 />
                      </View>
                    )
                  ) : null}
                  <Typography variant="small" style={{ flex: 1 }}>
                    {proactiveTeaser.trim() || 'Any questions? Let us know!'}
                  </Typography>
                </View>
              ) : null}
              <PreviewLauncherButton
                styleId={launcherStyle}
                buttonColor={selectedButtonColor}
                hoverColor={selectedHoverColor}
                iconColor={selectedIconColor}
                iconName={previewIconName}
                iconEnabled={launcherIconEnabled}
                labelEnabled={launcherLabelEnabled}
                label={buttonLabel.trim() || 'Chat with us'}
                borderRadius={radius}
                isPill={previewIsPill}
                align={buttonPosition === 'left' ? 'flex-start' : 'flex-end'}
 />
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() =>
                router.push('/(dashboard)/chat-widget/add' as Href)
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
                      chatWizardPatchScope: 'launcher_only',
                    });
                    router.push(
                      withChatEditQuery(
                        '/(dashboard)/chat-widget/add/chat/box',
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
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  stepRow: { gap: 8, paddingVertical: 4 },
  stepCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    gap: 2,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  presetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  styleGrid: { gap: 8 },
  styleCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  shapeRow: { flexDirection: 'row', gap: 10 },
  shapeBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nestedCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  insetRow: { flexDirection: 'row', gap: 10 },
  previewCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  offlineBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.45)',
    backgroundColor: 'rgba(251,146,60,0.12)',
  },
  previewLauncherWrap: {
    position: 'relative',
    overflow: 'visible',
    marginVertical: 8,
  },
  launcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
    zIndex: 1,
  },
  previewStage: {
    minHeight: 140,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    padding: 28,
    justifyContent: 'flex-end',
    overflow: 'visible',
    gap: 10,
  },
  teaserBubble: {
    maxWidth: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  teaserAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  teaserAvatarFallback: {
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  avatarUploadBtn: {
    alignSelf: 'flex-start',
  },
  avatarThumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footerBtn: { flex: 1 },
});
