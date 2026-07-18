import type { ObservabilityLogActor } from "@/api/observability/observability-logs.types";

export function formatLogActor(actor: ObservabilityLogActor): string {
  if (!actor) return "System";
  const name = [actor.firstName, actor.lastName].filter(Boolean).join(" ").trim();
  return name || actor.email;
}

export function formatLogWebsiteLabel(
  website: { name: string | null; url: string } | null,
): string {
  if (!website) return "—";
  return website.name?.trim() || website.url;
}

export function formatLogTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
