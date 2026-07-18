import type {
  OperatingChannels,
  ServiceChannel,
  WebsiteAssignmentTier,
} from "@/api/types/website-assignments.types";

/** Channels available in team-assignment UI — follows service scheduling operating mode. */
export function rosterAssignmentUiChannels(
  operatingChannels: OperatingChannels,
): ServiceChannel[] {
  if (operatingChannels === "internal_only") return ["Internal"];
  if (operatingChannels === "external_only") return ["External"];
  return ["Internal", "External"];
}

/** Roster tiers shown in assignment UI for the operating mode. */
export function rosterVisibleTiers(
  operatingChannels: OperatingChannels,
): WebsiteAssignmentTier[] {
  if (operatingChannels === "both") return ["Primary", "Backup"];
  return ["Primary", "Secondary", "Backup"];
}

export function resolveRosterDepartmentId(
  channel: ServiceChannel,
  selectedDepartmentId: string,
  departmentRoster: { departmentId: string; departmentType: string }[],
): string {
  const picked = selectedDepartmentId.trim();
  if (picked) return picked;
  const wantType = channel === "External" ? "External" : "Internal";
  return (
    departmentRoster.find((d) => d.departmentType === wantType)?.departmentId ??
    departmentRoster.find((d) => d.departmentType === "Internal")?.departmentId ??
    departmentRoster[0]?.departmentId ??
    ""
  );
}
