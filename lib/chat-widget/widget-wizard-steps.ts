import type { WidgetKind } from "./widgetDraft";

export type WidgetWizardStepDef = {
  index: number;
  label: string;
  hint: string;
  path: string;
};

const CHAT_STEPS: WidgetWizardStepDef[] = [
  {
    index: 0,
    label: "Button design",
    hint: "Launcher",
    path: "/dashboard/chat-widget/add/chat/button",
  },
  {
    index: 1,
    label: "Chat box",
    hint: "Panel & topics",
    path: "/dashboard/chat-widget/add/chat/box",
  },
  {
    index: 2,
    label: "Notifications",
    hint: "Alerts & forms",
    path: "/dashboard/chat-widget/add/chat/notifications",
  },
  {
    index: 3,
    label: "Install",
    hint: "Publish & embed",
    path: "/dashboard/chat-widget/add/chat/script",
  },
];

const BOTH_EXTRA_STEPS: WidgetWizardStepDef[] = [
  {
    index: 3,
    label: "Text Us",
    hint: "SMS surface",
    path: "/dashboard/chat-widget/add/text",
  },
  {
    index: 4,
    label: "Install",
    hint: "One script",
    path: "/dashboard/chat-widget/add/chat/script",
  },
];

export function resolveWidgetWizardSteps(draftType: WidgetKind | undefined): WidgetWizardStepDef[] {
  if (draftType === "both") {
    return [...CHAT_STEPS.slice(0, 3), ...BOTH_EXTRA_STEPS];
  }
  return CHAT_STEPS;
}

export function widgetWizardStepCount(draftType: WidgetKind | undefined): number {
  return resolveWidgetWizardSteps(draftType).length;
}
