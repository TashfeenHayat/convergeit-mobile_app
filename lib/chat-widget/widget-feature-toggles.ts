import {
  parseProactiveSecondaryCtaFromUi,
  type ProactiveSecondaryCta,
} from "./proactive-teaser-types";
import type { WidgetDraft } from "./widgetDraft";

function uiRecord(draft: WidgetDraft): Record<string, unknown> {
  return {
    proactiveTeaserEnabled: draft.proactiveTeaserEnabled,
    proactiveTeaser: draft.proactiveTeaser,
    proactiveTeaserAvatarEnabled: draft.proactiveTeaserAvatarEnabled,
    proactiveTeaserAvatarUrl: draft.proactiveTeaserAvatarDataUrl,
    proactiveSecondaryCtaEnabled: draft.proactiveSecondaryCtaEnabled,
    proactiveSecondaryCtaLabel: draft.proactiveSecondaryCtaLabel,
    proactiveSecondaryCtaHref: draft.proactiveSecondaryCtaHref,
    proactiveSecondaryCtaKind: draft.proactiveSecondaryCtaKind,
    closedMessagePreviewEnabled: draft.closedMessagePreviewEnabled,
    panelGreetingEnabled: draft.panelGreetingEnabled,
    chatWelcomeEnabled: draft.chatWelcomeEnabled,
  };
}

function normalizeUi(
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && "type" in raw) {
    return uiRecord(raw as WidgetDraft);
  }
  return raw as Record<string, unknown>;
}

/** Master switch: closed-state invitation bubble (off = FAB only). */
export function isProactiveTeaserFeatureOn(
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): boolean {
  const u = raw && "proactiveTeaser" in raw ? uiRecord(raw as WidgetDraft) : (raw ?? {});
  if (u.proactiveTeaserEnabled === false) return false;
  return true;
}

export type ResolvedProactiveTeaser = {
  active: boolean;
  text: string;
  avatarUrl: string;
  secondaryCta: ProactiveSecondaryCta;
};

export function resolveProactiveTeaser(
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): ResolvedProactiveTeaser {
  const u = normalizeUi(raw);
  const inactive: ResolvedProactiveTeaser = {
    active: false,
    text: "",
    avatarUrl: "",
    secondaryCta: { enabled: false, label: "", href: "", kind: "" },
  };
  if (!isProactiveTeaserFeatureOn(raw)) return inactive;

  const text = String(u.proactiveTeaser ?? "").trim();
  const secondaryCta = parseProactiveSecondaryCtaFromUi(u);
  const showAvatar =
    u.proactiveTeaserAvatarEnabled === true &&
    String(u.proactiveTeaserAvatarUrl ?? u.proactiveTeaserAvatarDataUrl ?? "").trim();
  const avatarUrl = showAvatar
    ? String(u.proactiveTeaserAvatarUrl ?? u.proactiveTeaserAvatarDataUrl ?? "").trim()
    : "";

  const active = Boolean(text) || secondaryCta.enabled;
  return { active, text, avatarUrl, secondaryCta };
}

export function isPanelGreetingFeatureOn(
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): boolean {
  const u = raw && "panelGreetingEnabled" in (raw as WidgetDraft) ? (raw as WidgetDraft) : raw;
  if (u && typeof u === "object" && "panelGreetingEnabled" in u) {
    return (u as WidgetDraft).panelGreetingEnabled !== false;
  }
  if (raw && typeof raw === "object" && "panelGreetingEnabled" in raw) {
    return raw.panelGreetingEnabled !== false;
  }
  return true;
}

export function isChatWelcomeFeatureOn(
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): boolean {
  const u = raw && "chatWelcomeEnabled" in (raw as WidgetDraft) ? (raw as WidgetDraft) : raw;
  if (u && typeof u === "object" && "chatWelcomeEnabled" in u) {
    return (u as WidgetDraft).chatWelcomeEnabled !== false;
  }
  if (raw && typeof raw === "object" && "chatWelcomeEnabled" in raw) {
    return raw.chatWelcomeEnabled !== false;
  }
  return true;
}

export function resolvePanelGreetingCopy(
  greeting: string,
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): string {
  if (!isPanelGreetingFeatureOn(raw)) return "";
  return greeting.trim();
}

export function resolveChatWelcomeCopy(
  welcome: string,
  raw: Record<string, unknown> | WidgetDraft | null | undefined,
): string {
  if (!isChatWelcomeFeatureOn(raw)) return "";
  return welcome.trim();
}
