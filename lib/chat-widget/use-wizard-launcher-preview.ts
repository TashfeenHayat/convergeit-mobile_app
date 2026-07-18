import { useEffect, useMemo, useState } from "react";
import {
  readChatWizardDraft,
  resolveEditWidgetKeyForNavigation,
} from "@/lib/chat-widget/chat-wizard-edit";
import {
  defaultWidgetDraft,
  mergePartialWidgetDraft,
  resolveLauncherPreviewFromDraft,
  type WidgetDraft,
} from "@/lib/chat-widget/widgetDraft";
import { resolveWizardLauncherPreview } from "@/lib/chat-widget/widget-wizard-save-trace";

type LauncherChromeFields = ReturnType<typeof resolveLauncherPreviewFromDraft>;

/**
 * Closed-widget launcher preview for wizard steps 2–4.
 * Prefers Step 1 save-trace JSON so later PATCH slices cannot reset shape/position.
 */
export function useWizardLauncherChrome(
  editWidgetKey: string | undefined,
  draftReady: boolean,
  refreshKey: number,
  overrides?: { buttonLabel?: string; themePrimaryColor?: string },
): { chromeDraft: WidgetDraft; launcherChrome: LauncherChromeFields } {
  const [launcherChrome, setLauncherChrome] = useState<LauncherChromeFields>(() =>
    resolveLauncherPreviewFromDraft(defaultWidgetDraft),
  );

  useEffect(() => {
    if (!draftReady) return;
    const d = readChatWizardDraft(resolveEditWidgetKeyForNavigation(editWidgetKey) || undefined);
    setLauncherChrome(resolveWizardLauncherPreview(d));
  }, [draftReady, editWidgetKey, refreshKey]);

  const chromeDraft = useMemo((): WidgetDraft => {
    const d = readChatWizardDraft(resolveEditWidgetKeyForNavigation(editWidgetKey) || undefined);
    return mergePartialWidgetDraft({
      ...d,
      ...launcherChrome,
      buttonLabel:
        d.launcherLabelEnabled === false
          ? d.buttonLabel
          : overrides?.buttonLabel !== undefined
            ? overrides.buttonLabel.trim()
            : d.buttonLabel,
      launcherLabelEnabled: d.launcherLabelEnabled,
      launcherIconEnabled: d.launcherIconEnabled,
      buttonColor: launcherChrome.buttonColor,
      buttonHoverColor: launcherChrome.buttonHoverColor,
      themePrimaryColor:
        overrides?.themePrimaryColor?.trim() ||
        d.themePrimaryColor ||
        launcherChrome.buttonColor,
      iconColor: launcherChrome.iconColor,
      iconDataUrl: launcherChrome.iconDataUrl,
      launcherIconPreset: launcherChrome.launcherIconPreset,
      proactiveTeaserEnabled: d.proactiveTeaserEnabled,
      proactiveTeaser: d.proactiveTeaser,
      proactiveTeaserAvatarEnabled: d.proactiveTeaserAvatarEnabled,
      proactiveTeaserAvatarDataUrl: d.proactiveTeaserAvatarDataUrl,
      proactiveSecondaryCtaEnabled: d.proactiveSecondaryCtaEnabled,
      proactiveSecondaryCtaLabel: d.proactiveSecondaryCtaLabel,
      proactiveSecondaryCtaHref: d.proactiveSecondaryCtaHref,
      proactiveSecondaryCtaKind: d.proactiveSecondaryCtaKind,
      closedMessagePreviewEnabled: d.closedMessagePreviewEnabled,
      launcherBadgeMode: d.launcherBadgeMode,
      fallbackNotificationText: d.fallbackNotificationText,
      launcherStyle: d.launcherStyle,
      themeDesignJsonAccent: d.themeDesignJsonAccent,
      themeDesignJsonDensity: d.themeDesignJsonDensity,
    });
  }, [
    editWidgetKey,
    launcherChrome,
    overrides?.buttonLabel,
    overrides?.themePrimaryColor,
  ]);

  return { chromeDraft, launcherChrome };
}
