import type {
  OperatingChannels,
  ServiceChannel,
} from "@/api/types/website-assignments.types";

export function canShowInternalSlots(op: OperatingChannels): boolean {
  return op === "internal_only" || op === "both";
}

export function canShowExternalSlots(op: OperatingChannels): boolean {
  return op === "external_only" || op === "both";
}

export function isChannelAllowed(
  channel: ServiceChannel,
  allowed: ServiceChannel[] | undefined,
): boolean {
  if (!allowed?.length) return true;
  return allowed.includes(channel);
}

export function channelDisabledTooltip(
  channel: ServiceChannel,
  operatingChannels: OperatingChannels,
): string {
  if (channel === "Internal" && !canShowInternalSlots(operatingChannels)) {
    return "Site is External only — internal slots are disabled.";
  }
  if (channel === "External" && !canShowExternalSlots(operatingChannels)) {
    return "Site is Internal only — external slots are disabled.";
  }
  return "";
}
