import type { WidgetInquiryOption } from "@/lib/chat-widget/widget-inquiry.types";
import {
  normalizeWidgetInquiryOptions,
  resolveInquiryRoutingTargets,
  toRuntimeInquiryOptions,
} from "@/lib/chat-widget/widget-inquiry.types";

export const WIDGET_EXPERIENCE_SCHEMA_VERSION = 1;

export type WidgetExperienceInquiryTopic = {
  label: string;
  routingKey: string;
  serviceChannel: "internal" | "external";
  departmentId: string | null;
  poolId: string | null;
};

export type WidgetExperienceV1 = {
  schemaVersion: number;
  mode: string;
  content: {
    headerTitle: string;
    greeting: string;
    chatWelcome: string;
    offline: string;
    sendPlaceholder: string;
    buttonLabel: string;
    proactiveTeaserEnabled: boolean;
    proactiveTeaser: string;
    proactiveTeaserAvatarEnabled: boolean;
    panelGreetingEnabled: boolean;
    chatWelcomeEnabled: boolean;
    proactiveTeaserAvatarUrl: string;
    proactiveSecondaryCtaEnabled: boolean;
    proactiveSecondaryCtaLabel: string;
    proactiveSecondaryCtaHref: string;
    proactiveSecondaryCtaKind: string;
    closedMessagePreviewEnabled?: boolean;
  };
  design: {
    launcher: Record<string, unknown>;
    panel: Record<string, unknown>;
    bubbles?: Record<string, unknown>;
    avatars?: Record<string, unknown>;
    banner: Record<string, unknown>;
    videoWelcome: { enabled: boolean; url: string };
    chatColors?: Record<string, unknown>;
    accent?: string;
    density?: string;
  };
  inquiry: {
    enabled: boolean;
    required: boolean;
    skipLabel: string;
    fallbackRoutingKey: string | null;
    topics: WidgetExperienceInquiryTopic[];
    fallback: WidgetExperienceInquiryTopic | null;
  };
  form: Record<string, unknown>;
  offlineForm: Record<string, unknown>;
  behavior: Record<string, unknown>;
  session: Record<string, unknown>;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function strFirst(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** Map widget draft rows to compiled `experience.inquiry.topics` (public embed shape). */
export function widgetInquiryToExperienceTopic(
  option: WidgetInquiryOption,
): WidgetExperienceInquiryTopic {
  const { departmentId, poolId, serviceChannel } = resolveInquiryRoutingTargets(option);
  return {
    label: option.label.trim(),
    routingKey: option.routingKey.trim(),
    serviceChannel,
    departmentId,
    poolId,
  };
}

/** When publish snapshot omits `inquiry.topics`, recover from `behavior.inquiryOptions`. */
export function hydrateExperienceInquiryFromBehavior(
  experience: WidgetExperienceV1,
): WidgetExperienceV1 {
  if (experience.inquiry.enabled === false) return experience;
  if (experience.inquiry.topics.length > 0) return experience;

  const behavior = isRecord(experience.behavior) ? experience.behavior : {};
  const opts = normalizeWidgetInquiryOptions(behavior.inquiryOptions);
  if (opts.length === 0) return experience;

  const topics = opts
    .map(widgetInquiryToExperienceTopic)
    .filter((t) => t.label && t.routingKey);

  const fallbackKey =
    experience.inquiry.fallbackRoutingKey?.trim() ||
    (typeof behavior.inquiryFallbackRoutingKey === "string"
      ? behavior.inquiryFallbackRoutingKey.trim()
      : "") ||
    null;

  const skipLabel = String(
    behavior.inquirySkipLabel ?? experience.inquiry.skipLabel ?? "General question",
  );

  const required =
    experience.inquiry.required === true || behavior.inquiryRequired === true;

  return {
    ...experience,
    inquiry: {
      ...experience.inquiry,
      enabled: true,
      required: required && topics.length > 0,
      skipLabel,
      fallbackRoutingKey: fallbackKey,
      topics,
      fallback: fallbackKey
        ? topics.find((t) => t.routingKey === fallbackKey) ?? null
        : experience.inquiry.fallback,
    },
  };
}

/** Widget PATCH DTO: inquiry lives under `config.behavior` only (not `config.inquiry`). */
export function buildInquiryBehaviorPatchFields(params: {
  inquiryOn?: boolean;
  inquiryOptions?: WidgetInquiryOption[];
  inquiryRequired?: boolean;
  inquirySkipLabel?: string;
  inquiryFallbackRoutingKey?: string;
}): Record<string, unknown> {
  const inquiryOptions =
    params.inquiryOn === false
      ? []
      : normalizeWidgetInquiryOptions(params.inquiryOptions ?? []);
  const fallbackKey = params.inquiryFallbackRoutingKey?.trim() || null;
  const skipLabel = params.inquirySkipLabel?.trim() || "General question";

  return {
    inquiryOptions,
    inquiryRequired: params.inquiryRequired === true,
    inquirySkipLabel: skipLabel,
    ...(fallbackKey ? { inquiryFallbackRoutingKey: fallbackKey } : {}),
  };
}

export function parseWidgetExperienceV1(raw: unknown): WidgetExperienceV1 | null {
  if (!isRecord(raw) || raw.schemaVersion !== WIDGET_EXPERIENCE_SCHEMA_VERSION) {
    return null;
  }
  const content = isRecord(raw.content) ? raw.content : {};
  const design = isRecord(raw.design) ? raw.design : {};
  const inquiry = isRecord(raw.inquiry) ? raw.inquiry : {};
  const topics = Array.isArray(inquiry.topics) ? inquiry.topics : [];
  const parsedTopics = topics
    .filter(isRecord)
    .map((t) => ({
      label: String(t.label ?? "").trim(),
      routingKey: String(t.routingKey ?? "").trim(),
      serviceChannel:
        String(t.serviceChannel ?? "internal").toLowerCase() === "external"
          ? ("external" as const)
          : ("internal" as const),
      departmentId:
        typeof t.departmentId === "string" && t.departmentId.trim()
          ? t.departmentId.trim()
          : null,
      poolId:
        typeof t.poolId === "string" && t.poolId.trim() ? t.poolId.trim() : null,
    }))
    .filter((t) => t.label && t.routingKey);

  const fallbackRaw = inquiry.fallback;
  const fallback =
    isRecord(fallbackRaw) && String(fallbackRaw.label ?? "").trim()
      ? {
          label: String(fallbackRaw.label).trim(),
          routingKey: String(fallbackRaw.routingKey ?? "").trim(),
          serviceChannel:
            String(fallbackRaw.serviceChannel ?? "internal").toLowerCase() ===
            "external"
              ? ("external" as const)
              : ("internal" as const),
          departmentId:
            typeof fallbackRaw.departmentId === "string"
              ? fallbackRaw.departmentId
              : null,
          poolId:
            typeof fallbackRaw.poolId === "string" ? fallbackRaw.poolId : null,
        }
      : null;

  const parsed: WidgetExperienceV1 = {
    schemaVersion: WIDGET_EXPERIENCE_SCHEMA_VERSION,
    mode: String(raw.mode ?? "HYBRID"),
    content: {
      headerTitle: String(content.headerTitle ?? ""),
      greeting: String(content.greeting ?? ""),
      chatWelcome: String(content.chatWelcome ?? ""),
      offline: String(content.offline ?? ""),
      sendPlaceholder: String(content.sendPlaceholder ?? ""),
      buttonLabel: String(content.buttonLabel ?? ""),
      proactiveTeaserEnabled: content.proactiveTeaserEnabled !== false,
      proactiveTeaser: String(content.proactiveTeaser ?? ""),
      proactiveTeaserAvatarEnabled: content.proactiveTeaserAvatarEnabled === true,
      panelGreetingEnabled: content.panelGreetingEnabled !== false,
      chatWelcomeEnabled: content.chatWelcomeEnabled !== false,
      proactiveTeaserAvatarUrl: String(content.proactiveTeaserAvatarUrl ?? ""),
      proactiveSecondaryCtaEnabled: content.proactiveSecondaryCtaEnabled === true,
      proactiveSecondaryCtaLabel: String(content.proactiveSecondaryCtaLabel ?? ""),
      proactiveSecondaryCtaHref: String(content.proactiveSecondaryCtaHref ?? ""),
      proactiveSecondaryCtaKind: String(content.proactiveSecondaryCtaKind ?? ""),
    },
    design: {
      launcher: isRecord(design.launcher) ? design.launcher : {},
      panel: isRecord(design.panel) ? design.panel : {},
      banner: isRecord(design.banner) ? design.banner : {},
      videoWelcome: {
        enabled: isRecord(design.videoWelcome) && design.videoWelcome.enabled === true,
        url: isRecord(design.videoWelcome)
          ? String(design.videoWelcome.url ?? "")
          : "",
      },
      chatColors: isRecord(design.chatColors) ? design.chatColors : {},
    },
    inquiry: {
      enabled:
        inquiry.enabled === false
          ? false
          : inquiry.enabled === true || parsedTopics.length > 0,
      required: inquiry.required === true && parsedTopics.length > 0,
      skipLabel: String(inquiry.skipLabel ?? "General question"),
      fallbackRoutingKey:
        typeof inquiry.fallbackRoutingKey === "string" &&
        inquiry.fallbackRoutingKey.trim()
          ? inquiry.fallbackRoutingKey.trim()
          : fallback?.routingKey ?? null,
      topics: parsedTopics,
      fallback,
    },
    form: isRecord(raw.form) ? raw.form : {},
    offlineForm: isRecord(raw.offlineForm) ? raw.offlineForm : {},
    behavior: isRecord(raw.behavior) ? raw.behavior : {},
    session: isRecord(raw.session) ? raw.session : {},
  };

  return hydrateExperienceInquiryFromBehavior(parsed);
}

export function experienceTopicToWidgetInquiry(
  topic: WidgetExperienceInquiryTopic,
): WidgetInquiryOption {
  return {
    label: topic.label,
    routingKey: topic.routingKey,
    serviceChannel: topic.serviceChannel,
    internalDepartmentId:
      topic.serviceChannel === "internal" ? topic.departmentId : null,
    externalDepartmentId:
      topic.serviceChannel === "external" ? topic.departmentId : null,
    internalPoolId: topic.serviceChannel === "internal" ? topic.poolId : null,
    externalPoolId: topic.serviceChannel === "external" ? topic.poolId : null,
  };
}

/** Overlay compiled experience onto legacy config record for appearance mappers. */
export function applyExperienceToConfigRecord(
  config: Record<string, unknown>,
  experience: WidgetExperienceV1 | null,
): Record<string, unknown> {
  if (!experience) return config;

  const inquiryOptionsFromTopics = experience.inquiry.topics.map(experienceTopicToWidgetInquiry);
  const inquiryOptionsFromBehavior = normalizeWidgetInquiryOptions(
    isRecord(experience.behavior) ? experience.behavior.inquiryOptions : [],
  );
  const inquiryOptions =
    inquiryOptionsFromTopics.length > 0
      ? inquiryOptionsFromTopics
      : inquiryOptionsFromBehavior;
  const design = experience.design;
  const panel = design.panel;
  const launcher = design.launcher;
  const banner = design.banner;
  const expColors = isRecord(design.chatColors) ? design.chatColors : {};
  const buttonHoverColor = strFirst(
    expColors.buttonHover,
    expColors.button_hover,
    launcher.primaryColor,
  );

  return {
    ...config,
    mode: experience.mode,
    greetingMessage: experience.content.greeting,
    welcomeMessage: experience.content.chatWelcome,
    offlineMessage: experience.content.offline,
    ctaButtonText: experience.content.buttonLabel,
    _experience: experience,
    theme: {
      ...(isRecord(config.theme) ? config.theme : {}),
      primaryColor: launcher.primaryColor,
      secondaryColor: launcher.secondaryColor,
      textColor: launcher.textColor,
      fontFamily: launcher.fontFamily,
      position: launcher.position,
      buttonShape: launcher.shape,
      ...(buttonHoverColor ? { buttonHoverColor } : {}),
    },
    ui: {
      ...(isRecord(config.ui) ? config.ui : {}),
      ...(buttonHoverColor ? { buttonHoverColor } : {}),
      headerTitle: experience.content.headerTitle,
      greetingMessage: experience.content.greeting,
      firstMessage: experience.content.chatWelcome,
      sendPlaceholder: experience.content.sendPlaceholder,
      buttonLabel: experience.content.buttonLabel,
      proactiveTeaserEnabled: experience.content.proactiveTeaserEnabled,
      proactiveTeaser: experience.content.proactiveTeaser,
      proactiveTeaserAvatarEnabled: experience.content.proactiveTeaserAvatarEnabled,
      proactiveTeaserAvatarUrl: experience.content.proactiveTeaserAvatarUrl,
      panelGreetingEnabled: experience.content.panelGreetingEnabled,
      chatWelcomeEnabled: experience.content.chatWelcomeEnabled,
      proactiveSecondaryCtaEnabled: experience.content.proactiveSecondaryCtaEnabled,
      proactiveSecondaryCtaLabel: experience.content.proactiveSecondaryCtaLabel,
      proactiveSecondaryCtaHref: experience.content.proactiveSecondaryCtaHref,
      proactiveSecondaryCtaKind: experience.content.proactiveSecondaryCtaKind,
      launcherIconPreset: String(launcher.iconPreset ?? ""),
      buttonIconUrl: String(launcher.iconUrl ?? ""),
      buttonPosition: launcher.position,
      buttonShape: launcher.shape,
      launcherInsetBottomPx: launcher.insetBottomPx,
      launcherInsetSidePx: launcher.insetSidePx,
      launcherStyle: launcher.style,
      headerLogoUrl: panel.headerLogoUrl,
      headerTitleAlign: panel.headerAlign,
      panelSurfaceStyle: String(panel.surfaceStyle ?? "solid"),
      bubbleSurfaceStyle: String(
        (isRecord(design.bubbles) ? design.bubbles.surfaceStyle : "") || "solid",
      ),
      agentAvatarEnabled:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? design.avatars.agent.enabled !== false
          : true,
      agentAvatarUrl:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? String(design.avatars.agent.url ?? "")
          : "",
      agentAvatarPreset:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? String(design.avatars.agent.preset ?? "phosphor-user-circle")
          : "phosphor-user-circle",
      visitorAvatarEnabled:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? design.avatars.visitor.enabled !== false
          : true,
      visitorAvatarUrl:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? String(design.avatars.visitor.url ?? "")
          : "",
      visitorAvatarPreset:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? String(design.avatars.visitor.preset ?? "phosphor-user-circle")
          : "phosphor-user-circle",
      closedMessagePreviewEnabled: experience.content.closedMessagePreviewEnabled,
      backgroundColor: panel.backgroundColor,
      boxWidth: panel.width,
      boxHeight: panel.height,
      bannerOn: banner.enabled,
      bannerTitle: banner.title,
      bannerDescription: banner.description,
      bannerImageUrl: banner.imageUrl,
      bannerVideoUrl: banner.videoUrl,
    },
    headerLogoUrl: panel.headerLogoUrl,
    behavior: {
      ...(isRecord(config.behavior) ? config.behavior : {}),
      ...experience.behavior,
      inquiryOptions,
      inquiryRequired: experience.inquiry.required,
      inquirySkipLabel: experience.inquiry.skipLabel,
      inquiryFallbackRoutingKey: experience.inquiry.fallbackRoutingKey,
      videoWelcomeOn: experience.design.videoWelcome.enabled,
      videoWelcomeUrl: experience.design.videoWelcome.url,
    },
    form: {
      ...(isRecord(config.form) ? config.form : {}),
      ...experience.form,
    },
    offlineForm: {
      ...(isRecord(config.offlineForm) ? config.offlineForm : {}),
      ...experience.offlineForm,
    },
    response: {
      ...(isRecord(config.response) ? config.response : {}),
      welcomeMessage: experience.content.chatWelcome,
      offlineMessage: experience.content.offline,
      greetingMessage: experience.content.greeting,
      sendPlaceholder: experience.content.sendPlaceholder,
      agentTalkToAgentEnabled: experience.behavior.agentTalkToAgentEnabled,
      talkToAgentTriggerText: experience.behavior.talkToAgentTriggerText,
    },
    session: {
      ...(isRecord(config.session) ? config.session : {}),
      ...experience.session,
    },
  };
}

export function inquiryOptionsFromExperience(
  experience: WidgetExperienceV1 | null,
): ReturnType<typeof toRuntimeInquiryOptions> {
  if (!experience) return [];
  const hydrated = hydrateExperienceInquiryFromBehavior(experience);
  if (!hydrated.inquiry.enabled) return [];
  return toRuntimeInquiryOptions(
    hydrated.inquiry.topics.map(experienceTopicToWidgetInquiry),
  );
}

export function inquiryFallbackFromExperience(
  experience: WidgetExperienceV1 | null,
): ReturnType<typeof toRuntimeInquiryOptions>[number] | null {
  if (!experience) return null;
  const hydrated = hydrateExperienceInquiryFromBehavior(experience);
  if (!hydrated.inquiry.enabled) return null;
  const key = hydrated.inquiry.fallbackRoutingKey?.trim();
  if (key) {
    const match = hydrated.inquiry.topics.find((t) => t.routingKey === key);
    if (match) {
      return toRuntimeInquiryOptions([experienceTopicToWidgetInquiry(match)])[0] ?? null;
    }
  }
  if (!hydrated.inquiry.fallback) return null;
  const opt = experienceTopicToWidgetInquiry(hydrated.inquiry.fallback);
  return toRuntimeInquiryOptions([opt])[0] ?? null;
}

/** Rebuild `theme.designJson` from experience (single source for titles + colors). */
export function buildThemeDesignJsonFromExperience(
  experience: WidgetExperienceV1,
): Record<string, unknown> {
  const { content, design, behavior, form, session } = experience;
  const launcher = design.launcher;
  const panel = design.panel;
  const banner = design.banner;
  const colors = isRecord(design.chatColors) ? design.chatColors : {};

  const accent =
    typeof design.accent === "string" && design.accent.trim()
      ? design.accent.trim()
      : undefined;
  const density =
    typeof design.density === "string" && design.density.trim()
      ? design.density.trim()
      : undefined;

  return {
    ...(accent ? { accent } : {}),
    ...(density ? { density } : {}),
    ui: {
      headerTitle: content.headerTitle,
      greetingMessage: content.greeting,
      firstMessage: content.chatWelcome,
      sendPlaceholder: content.sendPlaceholder,
      buttonLabel: content.buttonLabel,
      backgroundColor: panel.backgroundColor,
      boxWidth: panel.width,
      boxHeight: panel.height,
      proactiveTeaser: content.proactiveTeaser,
      proactiveTeaserEnabled: content.proactiveTeaserEnabled,
      launcherIconPreset: launcher.iconPreset,
      buttonIconUrl: launcher.iconUrl,
      buttonPosition: launcher.position,
      launcherInsetBottomPx: launcher.insetBottomPx,
      launcherInsetSidePx: launcher.insetSidePx,
      launcherStyle: launcher.style,
      headerLogoUrl: panel.headerLogoUrl,
      headerTitleAlign: panel.headerAlign,
      panelSurfaceStyle: String(panel.surfaceStyle ?? "solid"),
      bubbleSurfaceStyle: String(
        (isRecord(design.bubbles) ? design.bubbles.surfaceStyle : "") || "solid",
      ),
      agentAvatarEnabled:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? design.avatars.agent.enabled !== false
          : true,
      agentAvatarUrl:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? String(design.avatars.agent.url ?? "")
          : "",
      agentAvatarPreset:
        isRecord(design.avatars) && isRecord(design.avatars.agent)
          ? String(design.avatars.agent.preset ?? "phosphor-user-circle")
          : "phosphor-user-circle",
      visitorAvatarEnabled:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? design.avatars.visitor.enabled !== false
          : true,
      visitorAvatarUrl:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? String(design.avatars.visitor.url ?? "")
          : "",
      visitorAvatarPreset:
        isRecord(design.avatars) && isRecord(design.avatars.visitor)
          ? String(design.avatars.visitor.preset ?? "phosphor-user-circle")
          : "phosphor-user-circle",
      closedMessagePreviewEnabled: content.closedMessagePreviewEnabled,
      ...(typeof colors.buttonHover === "string" && colors.buttonHover.trim()
        ? { buttonHoverColor: colors.buttonHover.trim() }
        : typeof colors.button_hover === "string" && colors.button_hover.trim()
          ? { buttonHoverColor: colors.button_hover.trim() }
          : {}),
      bannerOn: banner.enabled,
      bannerTitle: banner.title,
      bannerDescription: banner.description,
      bannerImageUrl: banner.imageUrl,
      bannerVideoUrl: banner.videoUrl,
    },
    chat: {
      colors,
      launcher: {
        position: launcher.position,
        shape: launcher.shape,
        style: launcher.style,
        iconPreset: launcher.iconPreset,
        insetBottomPx: launcher.insetBottomPx,
        insetSidePx: launcher.insetSidePx,
      },
      panel: {
        surfaceStyle: String(panel.surfaceStyle ?? "solid"),
      },
      bubbles: {
        surfaceStyle: String(
          (isRecord(design.bubbles) ? design.bubbles.surfaceStyle : "") || "solid",
        ),
      },
      avatars: isRecord(design.avatars)
        ? design.avatars
        : {
            agent: { enabled: true, url: "", preset: "phosphor-user-circle" },
            visitor: { enabled: true, url: "", preset: "phosphor-user-circle" },
          },
      chatBox: {
        headerTitle: content.headerTitle,
        greetingMessage: content.greeting,
        firstMessage: content.chatWelcome,
        sendPlaceholder: content.sendPlaceholder,
        boxWidth: panel.width,
        boxHeight: panel.height,
        bannerEnabled: banner.enabled,
        bannerTitle: banner.title,
        bannerDescription: banner.description,
        bannerImageUrl: banner.imageUrl,
        bannerVideoUrl: banner.videoUrl,
        headerLogoUrl: panel.headerLogoUrl,
        headerTitleAlign: panel.headerAlign,
        headerAlign: panel.headerAlign,
        bannerMediaType: banner.mediaType,
      },
    },
    behavior: {
      ...behavior,
      videoWelcomeOn: design.videoWelcome.enabled,
      videoWelcomeUrl: design.videoWelcome.url,
    },
    form,
    session,
  };
}

/** Preserve Text Us blocks from published snapshot when rebuilding designJson from experience. */
export function mergeDesignJsonWithExperienceSnapshot(
  fromExperience: Record<string, unknown>,
  snapshot?: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!snapshot || Object.keys(snapshot).length === 0) return fromExperience;
  const merged: Record<string, unknown> = { ...fromExperience, ...snapshot };
  if (isRecord(snapshot.textUs)) {
    merged.textUs = snapshot.textUs;
  }
  if (isRecord(snapshot.chat)) {
    merged.chat = isRecord(fromExperience.chat)
      ? { ...fromExperience.chat, ...snapshot.chat }
      : snapshot.chat;
  }
  return merged;
}

/** Build runtime config record when public API omits legacy `config` blob. */
export function configRecordFromEnvelope(
  envelope: {
    experience?: WidgetExperienceV1 | null;
    clientSettings?: Record<string, unknown>;
    themeDesignJson?: Record<string, unknown>;
    textUsFormConfig?: Record<string, unknown>;
    config?: Record<string, unknown>;
    chatMode?: string;
  },
): Record<string, unknown> {
  if (envelope.experience) {
    const cfg = applyExperienceToConfigRecord({}, envelope.experience);
    const prevTheme = isRecord(cfg.theme) ? cfg.theme : {};
    const record: Record<string, unknown> = {
      ...cfg,
      theme: {
        ...prevTheme,
        designJson: mergeDesignJsonWithExperienceSnapshot(
          buildThemeDesignJsonFromExperience(envelope.experience),
          envelope.themeDesignJson,
        ),
      },
    };
    if (isRecord(envelope.textUsFormConfig)) {
      record.textUsFormConfig = envelope.textUsFormConfig;
    }
    return record;
  }
  const cs = envelope.clientSettings;
  if (isRecord(cs)) {
    return {
      mode: cs.mode ?? envelope.chatMode,
      ui: isRecord(cs.ui) ? cs.ui : {},
      theme: isRecord(cs.theme) ? cs.theme : {},
      behavior: isRecord(cs.behavior) ? cs.behavior : {},
      form: isRecord(cs.form) ? cs.form : {},
      response: isRecord(cs.response) ? cs.response : {},
      session: isRecord(cs.session) ? cs.session : {},
    };
  }
  return isRecord(envelope.config) ? envelope.config : {};
}
