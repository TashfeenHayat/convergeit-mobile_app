export const ASSIGNED_FILTER_OPTIONS = [
  { value: "", label: "All websites" },
  { value: "assigned", label: "Has agents" },
  { value: "unassigned", label: "No agents" },
] as const;

export const SCHEDULING_FILTER_OPTIONS = [
  { value: "", label: "All schedules" },
  { value: "ready", label: "Hours configured" },
  { value: "needed", label: "Please add schedule" },
] as const;

export const TOPICS_FILTER_OPTIONS = [
  { value: "", label: "All topics" },
  { value: "ready", label: "Topics configured" },
  { value: "needed", label: "Please add topics" },
] as const;

export const ROSTER_FILTER_OPTIONS = [
  { value: "", label: "All roster states" },
  { value: "complete", label: "Fully assigned" },
  { value: "incomplete", label: "Slots open" },
  { value: "scheduling_needed", label: "Please add schedule first" },
] as const;

export function parseAssignedFilter(value: string): boolean | undefined {
  if (value === "assigned") return true;
  if (value === "unassigned") return false;
  return undefined;
}

export function parseSchedulingFilter(value: string): boolean | undefined {
  if (value === "ready") return true;
  if (value === "needed") return false;
  return undefined;
}

export function parseTopicsFilter(value: string): boolean | undefined {
  if (value === "ready") return true;
  if (value === "needed") return false;
  return undefined;
}

export function parseRosterFilter(value: string): {
  serviceSchedulingConfigured?: boolean;
  fullyAssigned?: boolean;
  assigned?: boolean;
} {
  if (value === "complete") {
    return { serviceSchedulingConfigured: true, fullyAssigned: true };
  }
  if (value === "incomplete") {
    return { serviceSchedulingConfigured: true, fullyAssigned: false };
  }
  if (value === "scheduling_needed") {
    return { serviceSchedulingConfigured: false };
  }
  return {};
}
