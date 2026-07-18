import type { ServiceSchedulingTopic } from "@/services/chat/service-scheduling.types";
import type {
  ServiceChannel,
  WebsiteDepartmentRosterRow,
} from "@/api/types/website-assignments.types";

export type VisitorTopicRosterContext = {
  routingKey: string;
  clientLabel: string;
  internalDepartmentId: string;
  internalDepartmentName: string;
  internalPoolId: string | null;
  externalDepartmentId: string;
  externalDepartmentName: string;
  externalPoolId: string | null;
};

export function deptNameById(
  departmentRoster: WebsiteDepartmentRosterRow[],
): Map<string, { name: string; type: string }> {
  const map = new Map<string, { name: string; type: string }>();
  for (const row of departmentRoster) {
    map.set(row.departmentId, {
      name: row.departmentName,
      type: row.departmentType,
    });
  }
  return map;
}

export function buildVisitorTopicContexts(
  topics: ServiceSchedulingTopic[],
  departmentRoster: WebsiteDepartmentRosterRow[],
): VisitorTopicRosterContext[] {
  const names = deptNameById(departmentRoster);
  return topics
    .filter(
      (t) =>
        t.isActive !== false &&
        t.routingKey.trim() &&
        t.externalDepartmentId.trim(),
    )
    .map((t) => {
      const internalId = t.internalDepartmentId.trim();
      const externalId = t.externalDepartmentId.trim();
      return {
        routingKey: t.routingKey.trim(),
        clientLabel: t.clientLabel.trim() || t.routingKey.trim(),
        internalDepartmentId: internalId,
        internalDepartmentName:
          names.get(internalId)?.name || "Internal department",
        internalPoolId: t.internalPoolId?.trim() || null,
        externalDepartmentId: externalId,
        externalDepartmentName:
          names.get(externalId)?.name || "External department",
        externalPoolId: t.externalPoolId?.trim() || null,
      };
    })
    .sort((a, b) => a.clientLabel.localeCompare(b.clientLabel));
}

export function departmentIdForTopicChannel(
  topic: VisitorTopicRosterContext,
  channel: ServiceChannel,
): string {
  if (channel === "Internal") {
    return topic.internalDepartmentId.trim() || topic.externalDepartmentId;
  }
  return topic.externalDepartmentId;
}

export function departmentLabelForTopicChannel(
  topic: VisitorTopicRosterContext,
  channel: ServiceChannel,
): string {
  return channel === "Internal"
    ? topic.internalDepartmentName
    : topic.externalDepartmentName;
}

export function poolIdForTopicChannel(
  topic: VisitorTopicRosterContext,
  channel: ServiceChannel,
): string | null {
  return channel === "Internal" ? topic.internalPoolId : topic.externalPoolId;
}

export function findRosterRow(
  departmentRoster: WebsiteDepartmentRosterRow[],
  departmentId: string,
): WebsiteDepartmentRosterRow | undefined {
  return departmentRoster.find((r) => r.departmentId === departmentId);
}
