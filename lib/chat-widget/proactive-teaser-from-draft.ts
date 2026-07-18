import { resolveProactiveTeaser } from "./widget-feature-toggles";
import type { WidgetDraft } from "./widgetDraft";

export function proactiveTeaserPreviewFromDraft(draft: WidgetDraft) {
  const resolved = resolveProactiveTeaser(draft);
  return {
    text: resolved.text,
    avatarUrl: resolved.avatarUrl,
    secondaryCta: resolved.secondaryCta,
    active: resolved.active,
  };
}
