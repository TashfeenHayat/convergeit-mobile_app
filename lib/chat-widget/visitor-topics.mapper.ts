import type {
  ServiceSchedulingTopic,
  ServiceSchedulingTopicInput,
} from "@/services/chat/service-scheduling.types";
import {
  slugRoutingKeyFromLabel,
  type WidgetInquiryOption,
} from "@/lib/chat-widget/widget-inquiry.types";

/** Widget inquire row is routable when label + external department are set. */
export function isConfiguredWidgetInquiryTopic(topic: ServiceSchedulingTopic): boolean {
  if (topic.isActive === false) return false;
  return (
    Boolean(topic.routingKey?.trim()) &&
    Boolean(topic.clientLabel?.trim()) &&
    Boolean(topic.externalDepartmentId?.trim())
  );
}

/** @deprecated Use isConfiguredWidgetInquiryTopic */
export function isConfiguredSchedulingTopic(topic: ServiceSchedulingTopic): boolean {
  return isConfiguredWidgetInquiryTopic(topic);
}

export function isWidgetInquiryOptionConfigured(row: WidgetInquiryOption): boolean {
  return Boolean(row.label.trim() && row.externalDepartmentId?.trim());
}

export function widgetInquiryFromSchedulingBundle(
  topics: ServiceSchedulingTopic[],
): WidgetInquiryOption[] {
  return topics.filter(isConfiguredWidgetInquiryTopic).map(schedulingTopicToWidgetInquiry);
}

export function schedulingTopicToWidgetInquiry(
  topic: ServiceSchedulingTopic,
): WidgetInquiryOption {
  const hasInternal = Boolean(topic.internalDepartmentId?.trim());
  const hasExternal = Boolean(topic.externalDepartmentId?.trim());
  return {
    label: topic.clientLabel.trim(),
    routingKey: topic.routingKey.trim(),
    serviceChannel:
      hasInternal && !hasExternal
        ? "internal"
        : hasExternal && !hasInternal
          ? "external"
          : "internal",
    internalDepartmentId: topic.internalDepartmentId?.trim() || null,
    externalDepartmentId: topic.externalDepartmentId?.trim() || null,
    internalPoolId: null,
    externalPoolId: null,
  };
}

export function widgetInquiryToTopicInput(
  row: WidgetInquiryOption,
  index: number,
): ServiceSchedulingTopicInput {
  const label = row.label.trim();
  const routingKey =
    row.routingKey.trim() || (label ? slugRoutingKeyFromLabel(label) : "");
  const internalDepartmentId = row.internalDepartmentId?.trim() ?? "";
  return {
    routingKey,
    clientLabel: label,
    ...(internalDepartmentId ? { internalDepartmentId } : {}),
    externalDepartmentId: row.externalDepartmentId?.trim() ?? "",
    internalPoolId: null,
    externalPoolId: null,
    displayOrder: index,
    isActive: true,
  };
}

export function validateVisitorTopicsForSave(
  rows: WidgetInquiryOption[],
): string | null {
  if (rows.length === 0) {
    return "Add at least one inquiry topic before saving.";
  }
  for (const row of rows) {
    if (!row.routingKey.trim() && !row.label.trim()) {
      return "Each topic needs a routing key or client label.";
    }
    if (!row.label.trim()) return "Each topic needs a client label.";
    if (!row.externalDepartmentId?.trim()) {
      return "Each topic needs an external department.";
    }
  }
  return null;
}
