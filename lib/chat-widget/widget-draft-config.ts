import {
  buildChatWizardStep3Config,
  buildDesignJsonPatchFromDraft,
} from "./build-widget-install-body";
import type { WidgetDraft } from "./widgetDraft";
import { defaultWidgetDraft } from "./widgetDraft";
import { normalizeWidgetInquiryOptions } from "./widget-inquiry.types";
import {
  extractRuntimeChatAppearance,
  type RuntimeChatAppearance,
} from "@/lib/widget-runtime/widget-runtime-appearance";

/**
 * Build a published-shaped config record from the local wizard draft
 * so previews use the same mapper as the live embed.
 */
export function buildConfigRecordFromWidgetDraft(draft: WidgetDraft): Record<string, unknown> {
  const def = defaultWidgetDraft;
  const step3 = buildChatWizardStep3Config(draft);
  const behavior = (step3.behavior as Record<string, unknown>) ?? {};
  const form = (step3.form as Record<string, unknown>) ?? {};
  const response = (step3.response as Record<string, unknown>) ?? {};
  const session = (step3.session as Record<string, unknown>) ?? {};

  const iconRaw = draft.iconDataUrl?.trim() ?? "";
  const iconUrl =
    iconRaw.startsWith("http") || iconRaw.startsWith("data:") ? iconRaw : "";

  const bannerRaw = draft.bannerDataUrl?.trim() ?? "";
  const bannerUrl =
    bannerRaw.startsWith("http") || bannerRaw.startsWith("data:") ? bannerRaw : "";

  const visibleButtonLabel =
    draft.launcherLabelEnabled === false
      ? ""
      : typeof draft.buttonLabel === "string"
        ? draft.buttonLabel.trim()
        : def.buttonLabel;

  return {
    mode: draft.chatMode ?? "HYBRID",
    chatMode: draft.chatMode ?? "HYBRID",
    greetingMessage: draft.greetingMessage ?? def.greetingMessage,
    welcomeMessage: draft.greetingMessage ?? draft.firstMessage ?? def.greetingMessage,
    offlineMessage: draft.responseOfflineMessage ?? def.responseOfflineMessage,
    ctaButtonText: visibleButtonLabel,
    ui: {
      proactiveTeaser: draft.proactiveTeaser ?? def.proactiveTeaser,
      proactiveTeaserAvatarUrl:
        draft.proactiveTeaserAvatarDataUrl?.trim().startsWith("http") ||
        draft.proactiveTeaserAvatarDataUrl?.trim().startsWith("data:")
          ? draft.proactiveTeaserAvatarDataUrl.trim()
          : undefined,
      proactiveSecondaryCtaEnabled: draft.proactiveSecondaryCtaEnabled === true,
      proactiveSecondaryCtaLabel: draft.proactiveSecondaryCtaLabel,
      proactiveSecondaryCtaHref: draft.proactiveSecondaryCtaHref,
      proactiveSecondaryCtaKind: draft.proactiveSecondaryCtaKind,
      buttonLabel: visibleButtonLabel,
      launcherLabelEnabled: draft.launcherLabelEnabled !== false,
      launcherIconEnabled: draft.launcherIconEnabled !== false,
      buttonShape: draft.buttonShape,
      buttonPosition: draft.buttonPosition,
      launcherInsetBottomPx: draft.launcherInsetBottomPx,
      launcherInsetSidePx: draft.launcherInsetSidePx,
      launcherIconPreset: draft.launcherIconPreset,
      buttonIconUrl: iconUrl || undefined,
      buttonHoverColor: draft.buttonHoverColor,
      headerTitle: draft.headerTitle,
      headerTitleAlign: (draft.headerTitleAlign ?? "Center").toLowerCase(),
      greetingMessage: draft.greetingMessage,
      firstMessage: "",
      sendPlaceholder: draft.sendPlaceholder,
      messagePlaceholder: draft.messagePlaceholder,
      backgroundColor: draft.backgroundColor,
      boxWidth: draft.boxWidth,
      boxHeight: draft.boxHeight,
      bannerOn: draft.bannerOn,
      bannerTitle: draft.bannerTitle,
      bannerDescription: draft.bannerDescription,
      bannerMediaType: draft.bannerMediaType,
      bannerImageUrl:
        draft.bannerOn && draft.bannerMediaType !== "video" ? bannerUrl || undefined : undefined,
      bannerVideoUrl:
        draft.bannerOn && draft.bannerMediaType === "video" ? bannerUrl || undefined : undefined,
      panelGreetingEnabled: false,
      chatWelcomeEnabled: false,
    },
    theme: {
      name: draft.themeName,
      primaryColor: draft.themePrimaryColor ?? draft.buttonColor,
      secondaryColor: draft.themeSecondaryColor,
      buttonHoverColor: draft.buttonHoverColor,
      iconColor: draft.iconColor,
      textColor: draft.textColor,
      fontFamily: draft.themeFontFamily,
      buttonShape: draft.buttonShape,
      position: draft.buttonPosition,
      designJson: buildDesignJsonPatchFromDraft(draft, "full"),
    },
    behavior: {
      ...behavior,
      inquiryOptions:
        draft.inquiryOn === false
          ? []
          : normalizeWidgetInquiryOptions(draft.inquiryOptions ?? []),
      motionEnabled: draft.motionEnabled !== false,
    },
    form,
    response,
    session,
  };
}

/** Runtime appearance for wizard previews (same mapper as live embed). */
export function extractAppearanceFromWidgetDraft(draft: WidgetDraft): RuntimeChatAppearance {
  return extractRuntimeChatAppearance(buildConfigRecordFromWidgetDraft(draft));
}
