/** Visitor inquire pill — source of truth in published widget config (no scheduling sync). */

export type WidgetServiceChannel = "internal" | "external";

export type WidgetInquiryOption = {
  label: string;
  routingKey: string;
  serviceChannel: WidgetServiceChannel;
  internalDepartmentId: string | null;
  externalDepartmentId: string | null;
  internalPoolId: string | null;
  externalPoolId: string | null;
};

export function slugRoutingKeyFromLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 64);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function pickChannel(raw: unknown): WidgetServiceChannel {
  const u = String(raw ?? "")
    .trim()
    .toLowerCase();
  return u === "external" ? "external" : "internal";
}

function pickId(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  return s.length > 0 ? s : null;
}

/** Parse legacy `string[]` or structured rows from widget config / draft. */
export function normalizeWidgetInquiryOptions(raw: unknown): WidgetInquiryOption[] {
  if (!Array.isArray(raw)) return [];
  const out: WidgetInquiryOption[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const label = item.trim();
      if (!label) continue;
      out.push({
        label,
        routingKey: slugRoutingKeyFromLabel(label),
        serviceChannel: "internal",
        internalDepartmentId: null,
        externalDepartmentId: null,
        internalPoolId: null,
        externalPoolId: null,
      });
      continue;
    }
    if (!isRecord(item)) continue;
    const label = String(item.label ?? item.clientLabel ?? "").trim();
    if (!label) continue;
    const routingKey =
      String(item.routingKey ?? item.value ?? "").trim() ||
      slugRoutingKeyFromLabel(label);
    out.push({
      label,
      routingKey: slugRoutingKeyFromLabel(routingKey),
      serviceChannel: pickChannel(item.serviceChannel),
      internalDepartmentId: pickId(item.internalDepartmentId),
      externalDepartmentId: pickId(item.externalDepartmentId),
      internalPoolId: pickId(item.internalPoolId),
      externalPoolId: pickId(item.externalPoolId),
    });
  }
  return out;
}

function pickInquiryServiceChannel(option: WidgetInquiryOption): WidgetServiceChannel {
  const hasInternal = Boolean(option.internalDepartmentId?.trim());
  const hasExternal = Boolean(option.externalDepartmentId?.trim());
  if (hasInternal && !hasExternal) return "internal";
  if (hasExternal && !hasInternal) return "external";
  return option.serviceChannel;
}

/** Department + pool for the active visitor channel on this inquire row. */
export function resolveInquiryRoutingTargets(
  option: WidgetInquiryOption,
): {
  departmentId: string | null;
  poolId: string | null;
  serviceChannel: WidgetServiceChannel;
} {
  const channel = pickInquiryServiceChannel(option);
  if (channel === "external") {
    return {
      departmentId: option.externalDepartmentId,
      poolId: option.externalPoolId,
      serviceChannel: channel,
    };
  }
  return {
    departmentId: option.internalDepartmentId,
    poolId: option.internalPoolId,
    serviceChannel: channel,
  };
}

export type RuntimeInquiryOption = WidgetInquiryOption & {
  /** Alias for embed / API payloads */
  value: string;
};

export function toRuntimeInquiryOptions(
  options: WidgetInquiryOption[],
): RuntimeInquiryOption[] {
  return options.map((o) => ({ ...o, value: o.routingKey }));
}
