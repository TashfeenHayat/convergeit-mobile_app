/**
 * @deprecated Use `widget-wizard-draft-store` via `chat-wizard-edit` instead.
 * Kept as aliases so older imports do not touch localStorage.
 */
import type { WidgetDraft } from "./widgetDraft";
import {
  clearEditWizardDraft as clearMemoryEditDraft,
  patchEditWizardDraft,
  readEditWizardDraft,
  replaceEditWizardDraftFromApi,
} from "./widget-wizard-draft-store";

export function readWidgetEditDraft(widgetKey: string): WidgetDraft {
  return readEditWizardDraft(widgetKey);
}

export function saveWidgetEditDraft(widgetKey: string, update: Partial<WidgetDraft>): void {
  patchEditWizardDraft(widgetKey, update);
}

export function clearWidgetEditDraft(widgetKey: string): void {
  clearMemoryEditDraft(widgetKey);
}

export { replaceEditWizardDraftFromApi };
