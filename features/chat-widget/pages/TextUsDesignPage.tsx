import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
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

import { TextUsConfigJsonPreview } from '@/components/dashboard/chat-widget/TextUsConfigJsonPreview';
import { TextUsFormFieldsEditor } from '@/components/dashboard/chat-widget/TextUsFormFieldsEditor';
import { TextUsWizardLivePreview } from '@/components/dashboard/chat-widget/TextUsWizardLivePreview';
import { WidgetColorPickerField } from '@/components/dashboard/chat-widget/WidgetColorPickerField';
import { WidgetLauncherIconPicker } from '@/components/dashboard/chat-widget/WidgetLauncherIconPicker';
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
import { WIDGET_BRAND_COLOR_PRESETS } from '@/lib/chat-widget/brand-color-presets';
import {
  readChatWizardDraft,
  resolveRemoteWidgetKeyForChatWizard,
  saveChatWizardDraft,
  useChatWidgetWizardEdit,
  withChatEditQuery,
} from '@/lib/chat-widget/chat-wizard-edit';
import {
  DESIGN_ACCENT_SELECT_OPTIONS,
  DESIGN_DENSITY_SELECT_OPTIONS,
} from '@/lib/chat-widget/design-accent-density';
import type { LauncherIconPresetId } from '@/lib/chat-widget/launcher-icon-presets';
import {
  WIDGET_LAUNCHER_STYLE_OPTIONS,
  type WidgetLauncherStyleId,
} from '@/lib/chat-widget/launcher-style';
import { persistAssetUrlsOnDraft } from '@/lib/chat-widget/resolve-widget-draft-asset-urls';
import type { TextUsThemePreviewInput } from '@/lib/chat-widget/text-us-design-json';
import {
  DEFAULT_TEXT_US_FORM_FIELDS,
  resolveTextUsFormFields,
} from '@/lib/chat-widget/text-us-form-defaults';
import { FIELD_MAX } from '@/lib/chat-widget/widget-field-validation';
import {
  patchRemoteWidgetConfigurationWithMeta,
  resolveWizardKindFromDraft,
} from '@/lib/chat-widget/widget-remote-sync';
import {
  defaultWidgetDraft,
  type TextUsFormFieldDraft,
} from '@/lib/chat-widget/widgetDraft';
import {
  clampHeaderMinHeightPx,
  clampHeaderRadiusPx,
  normalizeHeaderMode,
  WIDGET_HEADER_MODE_OPTIONS,
  type WidgetHeaderMode,
} from '@/lib/widget-runtime/header-mode';
import { useAppTheme } from '@/theme';

function parseInsetPxString(raw: string, fallback: number): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(480, Math.max(0, n));
}

function parseBoxSizeString(
  raw: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number.parseInt(raw.trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Text Us design — placement, branding, form fields, live preview.
 * Opened after POST /widgets/installations + GET visitor-topics from type selection.
 * Save: PATCH text_us_only → /chat-widget/add/text/script
 */
export function TextUsDesignPage() {
  const theme = useAppTheme();
  const accent = theme.app.dashboard.accentBlue;
  const router = useRouter();
  const { editWidgetKey, isEdit, draftReady, hydrateError } =
    useChatWidgetWizardEdit();
  const editKey = editWidgetKey || null;

  const [position, setPosition] = useState(
    defaultWidgetDraft.textUsPosition ?? 'right',
  );
  const [verticalAnchor, setVerticalAnchor] = useState<'top' | 'bottom'>(
    defaultWidgetDraft.textUsVerticalAnchor ?? 'bottom',
  );
  const [insetBottomPx, setInsetBottomPx] = useState(
    String(defaultWidgetDraft.textUsInsetBottomPx ?? 28),
  );
  const [insetTopPx, setInsetTopPx] = useState(
    String(defaultWidgetDraft.textUsInsetTopPx ?? 28),
  );
  const [insetSidePx, setInsetSidePx] = useState(
    String(defaultWidgetDraft.textUsInsetSidePx ?? 28),
  );
  const [boxWidth, setBoxWidth] = useState(
    String(defaultWidgetDraft.textUsBoxWidth ?? 360),
  );
  const [boxHeight, setBoxHeight] = useState(
    String(defaultWidgetDraft.textUsBoxHeight ?? 480),
  );

  const [welcomeEnabled, setWelcomeEnabled] = useState(true);
  const [buttonColor, setButtonColor] = useState(
    defaultWidgetDraft.textUsButtonColor ?? '#1E63D5',
  );
  const [buttonHoverColor, setButtonHoverColor] = useState(
    defaultWidgetDraft.textUsButtonHoverColor ?? '#164EB0',
  );
  const [buttonLabel, setButtonLabel] = useState(
    defaultWidgetDraft.textUsButtonLabel ?? 'Text Us',
  );
  const [iconColor, setIconColor] = useState(
    defaultWidgetDraft.textUsIconColor ?? '#FFFFFF',
  );
  const [panelBackground, setPanelBackground] = useState(
    defaultWidgetDraft.textUsPanelBackground ?? '#f8fafc',
  );
  const [headerTitle, setHeaderTitle] = useState(
    defaultWidgetDraft.textUsHeaderTitle ?? 'Text Us',
  );
  const [headerTitleEnabled, setHeaderTitleEnabled] = useState(
    defaultWidgetDraft.textUsHeaderTitleEnabled !== false,
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    defaultWidgetDraft.textUsWelcomeMessage ??
      'Send us a message — we reply by SMS.',
  );
  const [headerLogoDataUrl, setHeaderLogoDataUrl] = useState('');
  const [headerLogoFileName, setHeaderLogoFileName] = useState('');
  const [headerLogoHeightPx, setHeaderLogoHeightPx] = useState(
    String(defaultWidgetDraft.textUsHeaderLogoHeightPx ?? 28),
  );
  const [headerLogoMaxWidthPx, setHeaderLogoMaxWidthPx] = useState(
    String(defaultWidgetDraft.textUsHeaderLogoMaxWidthPx ?? 96),
  );
  const [headerAlign, setHeaderAlign] = useState<'left' | 'center' | 'right'>(
    defaultWidgetDraft.textUsHeaderAlign ?? 'left',
  );
  const [headerMode, setHeaderMode] = useState<WidgetHeaderMode>(
    normalizeHeaderMode(defaultWidgetDraft.textUsHeaderMode ?? 'attached'),
  );
  const [headerMinHeightPx, setHeaderMinHeightPx] = useState(
    String(defaultWidgetDraft.textUsHeaderMinHeightPx ?? 44),
  );
  const [headerRadiusPx, setHeaderRadiusPx] = useState(
    String(defaultWidgetDraft.textUsHeaderRadiusPx ?? 12),
  );
  const [glowColor, setGlowColor] = useState(
    defaultWidgetDraft.textUsGlowColor ?? '',
  );
  const [motionEnabled, setMotionEnabled] = useState(
    defaultWidgetDraft.textUsMotionEnabled !== false,
  );
  const [launcherIconPreset, setLauncherIconPreset] =
    useState<LauncherIconPresetId>(
      defaultWidgetDraft.textUsLauncherIconPreset ?? 'phosphor-chat-circle',
    );
  const [launcherIconEnabled, setLauncherIconEnabled] = useState(
    defaultWidgetDraft.textUsLauncherIconEnabled !== false,
  );
  const [launcherStyle, setLauncherStyle] = useState<WidgetLauncherStyleId>(
    defaultWidgetDraft.textUsLauncherStyle ?? 'solid',
  );
  const [accentId, setAccentId] = useState(
    defaultWidgetDraft.textUsAccent ?? 'blue',
  );
  const [density, setDensity] = useState(
    defaultWidgetDraft.textUsDensity ?? 'comfortable',
  );
  const [formFields, setFormFields] = useState<TextUsFormFieldDraft[]>(
    DEFAULT_TEXT_US_FORM_FIELDS,
  );
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const draftSnapshot = readChatWizardDraft(editKey);
  const isBothFlow = draftSnapshot.type === 'both';
  const listHref = (
    draftSnapshot.type === 'text'
      ? '/(dashboard)/text-us'
      : '/(dashboard)/chat-widget'
  ) as Href;

  useEffect(() => {
    if (!draftReady) return;
    const d = readChatWizardDraft(editKey);
    if (d.type !== 'text' && d.type !== 'both') return;
    if (d.textUsPosition) setPosition(d.textUsPosition);
    if (d.textUsVerticalAnchor) setVerticalAnchor(d.textUsVerticalAnchor);
    if (d.textUsInsetBottomPx != null) setInsetBottomPx(String(d.textUsInsetBottomPx));
    if (d.textUsInsetTopPx != null) setInsetTopPx(String(d.textUsInsetTopPx));
    if (d.textUsInsetSidePx != null) setInsetSidePx(String(d.textUsInsetSidePx));
    if (d.textUsBoxWidth != null) setBoxWidth(String(d.textUsBoxWidth));
    if (d.textUsBoxHeight != null) setBoxHeight(String(d.textUsBoxHeight));
    if (d.textUsButtonColor) setButtonColor(d.textUsButtonColor);
    if (d.textUsButtonHoverColor) setButtonHoverColor(d.textUsButtonHoverColor);
    if (d.textUsButtonLabel != null) setButtonLabel(d.textUsButtonLabel);
    if (d.textUsIconColor) setIconColor(d.textUsIconColor);
    if (d.textUsPanelBackground) setPanelBackground(d.textUsPanelBackground);
    if (d.textUsHeaderTitle != null) setHeaderTitle(d.textUsHeaderTitle);
    if (d.textUsHeaderTitleEnabled != null) {
      setHeaderTitleEnabled(d.textUsHeaderTitleEnabled !== false);
    }
    if (d.textUsWelcomeMessage !== undefined) {
      setWelcomeMessage(d.textUsWelcomeMessage);
      setWelcomeEnabled(Boolean(d.textUsWelcomeMessage?.trim()));
    }
    if (d.textUsHeaderLogoDataUrl) {
      setHeaderLogoDataUrl(d.textUsHeaderLogoDataUrl);
      setHeaderLogoFileName('Uploaded logo');
    }
    if (d.textUsHeaderLogoHeightPx != null) {
      setHeaderLogoHeightPx(String(d.textUsHeaderLogoHeightPx));
    }
    if (d.textUsHeaderLogoMaxWidthPx != null) {
      setHeaderLogoMaxWidthPx(String(d.textUsHeaderLogoMaxWidthPx));
    }
    if (d.textUsHeaderAlign) setHeaderAlign(d.textUsHeaderAlign);
    setHeaderMode(normalizeHeaderMode(d.textUsHeaderMode ?? 'attached'));
    setHeaderMinHeightPx(String(d.textUsHeaderMinHeightPx ?? 44));
    setHeaderRadiusPx(String(d.textUsHeaderRadiusPx ?? 12));
    if (d.textUsGlowColor != null) setGlowColor(d.textUsGlowColor);
    if (d.textUsMotionEnabled != null) setMotionEnabled(d.textUsMotionEnabled);
    if (d.textUsLauncherIconPreset) setLauncherIconPreset(d.textUsLauncherIconPreset);
    if (d.textUsLauncherIconEnabled != null) {
      setLauncherIconEnabled(d.textUsLauncherIconEnabled);
    }
    if (d.textUsLauncherStyle) setLauncherStyle(d.textUsLauncherStyle);
    if (d.textUsAccent) setAccentId(d.textUsAccent);
    if (d.textUsDensity) setDensity(d.textUsDensity);
    setFormFields(resolveTextUsFormFields(d.textUsFormFields));
  }, [draftReady, editKey]);

  const previewFields = useMemo(
    () => resolveTextUsFormFields(formFields),
    [formFields],
  );

  const themePreview: TextUsThemePreviewInput = useMemo(
    () => ({
      buttonColor,
      buttonHoverColor,
      iconColor,
      position,
      verticalAnchor,
      insetBottomPx: parseInsetPxString(insetBottomPx, 28),
      insetTopPx: parseInsetPxString(insetTopPx, 28),
      insetSidePx: parseInsetPxString(insetSidePx, 28),
      boxWidth: parseBoxSizeString(boxWidth, 360, 280, 520),
      boxHeight: parseBoxSizeString(boxHeight, 480, 320, 640),
      headerTitle: headerTitleEnabled ? headerTitle : '',
      headerTitleEnabled,
      welcomeMessage: welcomeEnabled ? welcomeMessage : '',
      buttonLabel: buttonLabel.trim() || 'Text Us',
      headerLogoUrl: headerLogoDataUrl.startsWith('http')
        ? headerLogoDataUrl
        : undefined,
      headerLogoHeightPx: parseBoxSizeString(headerLogoHeightPx, 28, 16, 96),
      headerLogoMaxWidthPx: parseBoxSizeString(headerLogoMaxWidthPx, 96, 48, 200),
      headerAlign,
      headerMode,
      headerMinHeightPx: clampHeaderMinHeightPx(headerMinHeightPx),
      headerRadiusPx: clampHeaderRadiusPx(headerRadiusPx),
      motionEnabled,
      panelBackground,
      launcherIconPreset,
      launcherIconEnabled,
      launcherStyle,
      launcherGlowColor: glowColor.trim() || undefined,
      accent: accentId,
      density,
    }),
    [
      buttonColor,
      buttonHoverColor,
      buttonLabel,
      iconColor,
      position,
      verticalAnchor,
      insetBottomPx,
      insetTopPx,
      insetSidePx,
      boxWidth,
      boxHeight,
      headerTitle,
      headerTitleEnabled,
      welcomeEnabled,
      welcomeMessage,
      headerLogoDataUrl,
      headerLogoHeightPx,
      headerLogoMaxWidthPx,
      headerAlign,
      headerMode,
      headerMinHeightPx,
      headerRadiusPx,
      glowColor,
      motionEnabled,
      panelBackground,
      launcherIconPreset,
      launcherIconEnabled,
      launcherStyle,
      accentId,
      density,
    ],
  );

  const pickHeaderLogo = async () => {
    if (logoUploading) return;
    setLogoUploading(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          'Photo library access is required to upload a header logo.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
        Alert.alert('Too large', 'Logo must be 10 MB or smaller.');
        return;
      }
      const mime = asset.mimeType ?? 'image/png';
      const next =
        asset.base64 != null && asset.base64.length > 0
          ? `data:${mime};base64,${asset.base64}`
          : asset.uri;
      setHeaderLogoDataUrl(next);
      setHeaderLogoFileName(asset.fileName ?? 'Uploaded logo');
    } catch (err) {
      Alert.alert('Upload failed', extractApiErrorMessage(err));
    } finally {
      setLogoUploading(false);
    }
  };

  const persistAndContinue = () => {
    if (saving) return;
    if (!launcherIconEnabled && !buttonLabel.trim()) {
      Alert.alert(
        'Launcher text required',
        'Add launcher button text when the icon is turned off.',
      );
      return;
    }
    void (async () => {
      const textUsFormFields = resolveTextUsFormFields(formFields);
      const prev = readChatWizardDraft(editKey);
      const rk =
        resolveRemoteWidgetKeyForChatWizard(editKey, prev) ||
        prev.remoteWidgetKey?.trim();
      if (!rk) {
        Alert.alert(
          'Missing widget',
          'Create the widget draft first from Add Text Us.',
        );
        return;
      }

      setSaving(true);
      try {
        saveChatWizardDraft(editKey, {
          ...prev,
          type: prev.type ?? 'text',
          completed: false,
          textUsButtonColor: buttonColor,
          textUsButtonHoverColor: buttonHoverColor,
          textUsButtonLabel: buttonLabel.trim() || 'Text Us',
          textUsIconColor: iconColor,
          textUsPanelBackground: panelBackground,
          textUsPosition: position,
          textUsVerticalAnchor: verticalAnchor,
          textUsInsetBottomPx: parseInsetPxString(insetBottomPx, 28),
          textUsInsetTopPx: parseInsetPxString(insetTopPx, 28),
          textUsInsetSidePx: parseInsetPxString(insetSidePx, 28),
          textUsBoxWidth: parseBoxSizeString(boxWidth, 360, 280, 520),
          textUsBoxHeight: parseBoxSizeString(boxHeight, 480, 320, 640),
          textUsHeaderTitle: headerTitleEnabled ? headerTitle.trim() : '',
          textUsHeaderTitleEnabled: headerTitleEnabled,
          textUsWelcomeMessage: welcomeEnabled ? welcomeMessage.trim() : '',
          textUsHeaderLogoDataUrl: headerLogoDataUrl,
          textUsHeaderLogoHeightPx: parseBoxSizeString(
            headerLogoHeightPx,
            28,
            16,
            96,
          ),
          textUsHeaderLogoMaxWidthPx: parseBoxSizeString(
            headerLogoMaxWidthPx,
            96,
            48,
            200,
          ),
          textUsHeaderAlign: headerAlign,
          textUsHeaderMode: normalizeHeaderMode(headerMode),
          textUsHeaderMinHeightPx: clampHeaderMinHeightPx(headerMinHeightPx),
          textUsHeaderRadiusPx: clampHeaderRadiusPx(headerRadiusPx),
          textUsGlowColor: glowColor.trim(),
          textUsMotionEnabled: motionEnabled,
          textUsLauncherIconPreset: launcherIconPreset,
          textUsLauncherIconEnabled: launcherIconEnabled,
          textUsLauncherStyle: launcherStyle,
          textUsAccent: accentId,
          textUsDensity: density,
          textUsFormFields,
        });

        const latest = readChatWizardDraft(editKey);
        const patchMeta = await patchRemoteWidgetConfigurationWithMeta({
          widgetKey: rk,
          widgetKind: resolveWizardKindFromDraft(latest),
          draft: latest,
          publishNow: false,
          chatWizardPatchScope: 'text_us_only',
        });
        if (patchMeta.assetUrls) {
          saveChatWizardDraft(
            editKey,
            persistAssetUrlsOnDraft(latest, patchMeta.assetUrls),
          );
        }
        if (patchMeta.assetErrors?.length) {
          Alert.alert('Asset upload', patchMeta.assetErrors.join(' '));
        }

        const nextPath = isBothFlow
          ? '/(dashboard)/chat-widget/add/chat/script'
          : '/(dashboard)/chat-widget/add/text/script';
        router.push(withChatEditQuery(nextPath, editKey || rk) as Href);
      } catch (err) {
        Alert.alert(
          'Save failed',
          extractApiErrorMessage(
            err,
            'Could not save Text Us configuration to the server.',
          ),
        );
      } finally {
        setSaving(false);
      }
    })();
  };

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <DashboardPageIntro subtitle="Position, branding, form fields, and visitor analytics — same quality as chat widget." />

        <AppCard style={{ gap: 14 }}>
          <View
            style={[
              styles.infoBanner,
              {
                borderColor: accent,
                backgroundColor: 'rgba(30,99,213,0.12)',
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={accent} />
            <Typography variant="small" style={{ flex: 1, color: accent }}>
              Working draft — each step saves with PATCH. Real sites show the
              widget only after you click Go live. Use the test link to preview
              anytime.
            </Typography>
          </View>

          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Placement & size
          </Typography>
          <Typography variant="small" muted>
            Insets use real site pixels on a 1280×720 scaled viewport — 1:1 with
            the live embed.
          </Typography>

          <View style={styles.row2}>
            <View style={styles.flex1}>
              <SelectField
                label="Vertical anchor"
                value={verticalAnchor}
                onChange={(v) =>
                  setVerticalAnchor(v === 'top' ? 'top' : 'bottom')
                }
                options={[
                  { label: 'Bottom of screen', value: 'bottom' },
                  { label: 'Top of screen', value: 'top' },
                ]}
              />
            </View>
            <View style={styles.flex1}>
              <SelectField
                label="Horizontal alignment"
                value={position}
                onChange={setPosition}
                options={[
                  { label: 'Left', value: 'left' },
                  { label: 'Center', value: 'center' },
                  { label: 'Right', value: 'right' },
                ]}
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.flex1}>
              {verticalAnchor === 'bottom' ? (
                <InputField
                  label="Inset from bottom (px)"
                  value={insetBottomPx}
                  onChangeText={setInsetBottomPx}
                  keyboardType="number-pad"
                />
              ) : (
                <InputField
                  label="Inset from top (px)"
                  value={insetTopPx}
                  onChangeText={setInsetTopPx}
                  keyboardType="number-pad"
                />
              )}
            </View>
            <View style={styles.flex1}>
              <InputField
                label="Inset from side (px)"
                value={insetSidePx}
                onChangeText={setInsetSidePx}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row2}>
            <View style={styles.flex1}>
              <InputField
                label="Panel width (280–520)"
                value={boxWidth}
                onChangeText={setBoxWidth}
                keyboardType="number-pad"
              />
            </View>
            <View style={styles.flex1}>
              <InputField
                label="Panel height (320–640)"
                value={boxHeight}
                onChangeText={setBoxHeight}
                keyboardType="number-pad"
              />
            </View>
          </View>

          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Branding & launcher
          </Typography>

          <View style={styles.row3}>
            <View style={styles.flex1}>
              <WidgetColorPickerField
                label="Button color"
                value={buttonColor}
                onChange={setButtonColor}
              />
            </View>
            <View style={styles.flex1}>
              <WidgetColorPickerField
                label="Hover color"
                value={buttonHoverColor}
                onChange={setButtonHoverColor}
              />
            </View>
            <View style={styles.flex1}>
              <WidgetColorPickerField
                label="Icon color"
                value={iconColor}
                onChange={setIconColor}
              />
            </View>
          </View>

          <WidgetColorPickerField
            label="Panel background"
            value={panelBackground}
            onChange={setPanelBackground}
          />

          <InputField
            label="Launcher button text"
            value={buttonLabel}
            onChangeText={(v) =>
              setButtonLabel(v.slice(0, FIELD_MAX.shortLabel))
            }
            helperText={
              launcherIconEnabled
                ? 'Shown on the floating pill next to the icon — e.g. Text Us, SMS us.'
                : 'Required when the icon is off — this is the only label visitors see.'
            }
          />
          <Typography variant="small" muted>
            {buttonLabel.length}/{FIELD_MAX.shortLabel}
          </Typography>

          <Typography variant="medium" style={{ fontWeight: '600' }}>
            Brand presets
          </Typography>
          <View style={styles.presetRow}>
            {WIDGET_BRAND_COLOR_PRESETS.map((preset) => {
              const active = buttonColor === preset.buttonColor;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => {
                    setButtonColor(preset.buttonColor);
                    setButtonHoverColor(preset.buttonHoverColor);
                    setIconColor(preset.iconColor);
                  }}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: active
                        ? accent
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.presetDot,
                      { backgroundColor: preset.buttonColor },
                    ]}
                  />
                  <Typography variant="small" style={{ fontWeight: '600' }}>
                    {preset.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>

          <Typography variant="medium" style={{ fontWeight: '600' }}>
            Header logo (optional)
          </Typography>
          <Pressable
            onPress={() => void pickHeaderLogo()}
            style={[
              styles.uploadBox,
              { borderColor: accent, backgroundColor: 'rgba(6,12,54,0.25)' },
            ]}
          >
            {logoUploading ? (
              <ActivityIndicator color={accent} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={22} color={accent} />
            )}
            <Typography variant="small" muted>
              {headerLogoFileName || 'PNG or SVG, max 10 MB'}
            </Typography>
          </Pressable>
          {headerLogoDataUrl ? (
            <View style={{ gap: 10 }}>
              <View style={styles.logoRow}>
                <Image
                  source={{ uri: headerLogoDataUrl }}
                  style={{
                    height: parseBoxSizeString(headerLogoHeightPx, 28, 16, 96),
                    width: parseBoxSizeString(headerLogoMaxWidthPx, 96, 48, 200),
                    resizeMode: 'contain',
                  }}
                />
                <Button
                  variant="secondary"
                  size="compact"
                  onPress={() => {
                    setHeaderLogoDataUrl('');
                    setHeaderLogoFileName('');
                  }}
                >
                  Remove
                </Button>
              </View>
              <View style={styles.row2}>
                <View style={styles.flex1}>
                  <InputField
                    label="Logo height (px)"
                    value={headerLogoHeightPx}
                    onChangeText={setHeaderLogoHeightPx}
                    keyboardType="number-pad"
                    helperText="16–96"
                  />
                </View>
                <View style={styles.flex1}>
                  <InputField
                    label="Logo max width (px)"
                    value={headerLogoMaxWidthPx}
                    onChangeText={setHeaderLogoMaxWidthPx}
                    keyboardType="number-pad"
                    helperText="48–200"
                  />
                </View>
              </View>
            </View>
          ) : null}

          <SelectField
            label="Header logo alignment"
            value={headerAlign}
            onChange={(v) =>
              setHeaderAlign(
                v === 'center' || v === 'right' ? v : 'left',
              )
            }
            options={[
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]}
          />
          <SelectField
            label="Header layout"
            value={headerMode}
            onChange={(v) => setHeaderMode(normalizeHeaderMode(v))}
            options={WIDGET_HEADER_MODE_OPTIONS.map((o) => ({
              label: `${o.label} – ${o.description}`,
              value: o.id,
            }))}
          />
          <Typography variant="small" muted>
            Attached = bar on the panel. Detached = floats above the panel with
            a gap.
          </Typography>
          <View style={styles.row2}>
            <View style={styles.flex1}>
              <InputField
                label="Header min height (px)"
                value={headerMinHeightPx}
                onChangeText={setHeaderMinHeightPx}
                keyboardType="number-pad"
                helperText="36–80. Default 44."
              />
            </View>
            <View style={styles.flex1}>
              <InputField
                label="Detached corner radius (px)"
                value={headerRadiusPx}
                onChangeText={setHeaderRadiusPx}
                keyboardType="number-pad"
                helperText="Used when layout is Detached."
              />
            </View>
          </View>

          {launcherStyle === 'glow' ? (
            <WidgetColorPickerField
              label="Glow color"
              value={glowColor || buttonColor}
              onChange={setGlowColor}
            />
          ) : null}

          <WidgetWizardToggleRow
            label="Panel animations"
            description="Smooth open/close motion on the visitor site."
            value={motionEnabled}
            onChange={setMotionEnabled}
          />
          <WidgetWizardToggleRow
            label="Launcher icon"
            description="Turn off to show only your button text (no glyph)."
            value={launcherIconEnabled}
            onChange={setLauncherIconEnabled}
          />

          {launcherIconEnabled ? (
            <WidgetLauncherIconPicker
              value={launcherIconPreset}
              onChange={setLauncherIconPreset}
              accentColor={buttonColor}
            />
          ) : (
            <Typography variant="small" muted>
              Icon hidden — visitors will see your launcher button text only.
            </Typography>
          )}

          <Typography variant="medium" style={{ fontWeight: '600' }}>
            Launcher style
          </Typography>
          <View style={styles.styleRow}>
            {WIDGET_LAUNCHER_STYLE_OPTIONS.map((opt) => {
              const active = launcherStyle === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  onPress={() => setLauncherStyle(opt.id)}
                  style={[
                    styles.styleChip,
                    {
                      borderColor: active
                        ? accent
                        : theme.app.dashboard.cardBorder,
                      backgroundColor: active
                        ? 'rgba(30,99,213,0.2)'
                        : theme.app.dashboard.overlayLight,
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

          <View style={styles.row2}>
            <View style={styles.flex1}>
              <SelectField
                label="Accent"
                value={accentId}
                onChange={setAccentId}
                options={DESIGN_ACCENT_SELECT_OPTIONS}
              />
            </View>
            <View style={styles.flex1}>
              <SelectField
                label="Density"
                value={density}
                onChange={setDensity}
                options={DESIGN_DENSITY_SELECT_OPTIONS}
              />
            </View>
          </View>

          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Panel content
          </Typography>
          <WidgetWizardToggleRow
            label="Header title"
            description="Turn off to hide text and show only your uploaded logo in the header bar."
            value={headerTitleEnabled}
            onChange={setHeaderTitleEnabled}
          />
          {headerTitleEnabled ? (
            <>
              <InputField
                label="Header title text"
                value={headerTitle}
                onChangeText={(v) => setHeaderTitle(v.slice(0, FIELD_MAX.title))}
              />
              <Typography variant="small" muted>
                {headerTitle.length}/{FIELD_MAX.title}
              </Typography>
            </>
          ) : (
            <Typography variant="small" muted>
              Title hidden — upload a logo under Branding for a logo-only
              header.
            </Typography>
          )}
          <WidgetWizardToggleRow
            label="Welcome message"
            value={welcomeEnabled}
            onChange={setWelcomeEnabled}
          />
          {welcomeEnabled ? (
            <>
              <InputField
                label="Welcome message"
                value={welcomeMessage}
                onChangeText={(v) =>
                  setWelcomeMessage(v.slice(0, FIELD_MAX.message))
                }
                multiline
              />
              <Typography variant="small" muted>
                {welcomeMessage.length}/{FIELD_MAX.message}
              </Typography>
            </>
          ) : null}

          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Visitor form
          </Typography>
          <Typography variant="small" muted>
            Default fields plus custom fields — you control keys, labels,
            placeholders, and types.
          </Typography>
          <TextUsFormFieldsEditor
            fields={formFields}
            onChange={setFormFields}
          />

          <Typography variant="mediumLarge" style={{ fontWeight: '700' }}>
            Visitor analytics
          </Typography>
          <View
            style={[
              styles.infoBanner,
              {
                borderColor: accent,
                backgroundColor: 'rgba(30,99,213,0.1)',
              },
            ]}
          >
            <Ionicons name="information-circle-outline" size={18} color={accent} />
            <View style={{ flex: 1, gap: 6 }}>
              <Typography variant="small">
                Text Us only: visitors are counted when your embed script loads
                — they do not need to open Text Us or submit the form.
              </Typography>
              <Typography variant="small" muted>
                Chat + Text Us (both): one script, one visitor per page load —
                Text Us does not add a second counter.
              </Typography>
            </View>
          </View>

          <TextUsWizardLivePreview
            buttonColor={buttonColor}
            buttonHoverColor={buttonHoverColor}
            iconColor={iconColor}
            buttonLabel={buttonLabel}
            launcherIconPreset={launcherIconPreset}
            launcherIconEnabled={launcherIconEnabled}
            launcherStyle={launcherStyle}
            panelBackground={panelBackground}
            position={position}
            verticalAnchor={verticalAnchor}
            insetBottomPx={parseInsetPxString(insetBottomPx, 28)}
            insetTopPx={parseInsetPxString(insetTopPx, 28)}
            insetSidePx={parseInsetPxString(insetSidePx, 28)}
            boxWidth={parseBoxSizeString(boxWidth, 360, 280, 520)}
            boxHeight={parseBoxSizeString(boxHeight, 480, 320, 640)}
            headerTitle={headerTitle}
            headerTitleEnabled={headerTitleEnabled}
            headerLogoDataUrl={headerLogoDataUrl || undefined}
            headerLogoHeightPx={parseBoxSizeString(headerLogoHeightPx, 28, 16, 96)}
            headerLogoMaxWidthPx={parseBoxSizeString(
              headerLogoMaxWidthPx,
              96,
              48,
              200,
            )}
            headerAlign={headerAlign}
            headerMode={headerMode}
            headerMinHeightPx={clampHeaderMinHeightPx(headerMinHeightPx)}
            headerRadiusPx={clampHeaderRadiusPx(headerRadiusPx)}
            glowColor={glowColor.trim() || undefined}
            welcomeMessage={welcomeMessage}
            welcomeEnabled={welcomeEnabled}
            fields={previewFields}
          />

          <TextUsConfigJsonPreview
            theme={themePreview}
            fields={previewFields}
          />

          <View style={styles.footer}>
            <Button
              variant="secondary"
              size="compact"
              onPress={() => router.push(listHref)}
              style={styles.footerBtn}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="compact"
              loading={saving}
              disabled={saving}
              onPress={persistAndContinue}
              style={styles.footerBtn}
            >
              {saving ? 'Saving…' : isBothFlow ? 'Next: Install' : 'Save'}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flex1: { flex: 1, minWidth: 0 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  presetDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  styleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '22%',
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  footerBtn: { flex: 1 },
});
