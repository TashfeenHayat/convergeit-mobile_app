export type ProactiveSecondaryCtaKind = "whatsapp" | "link" | "";

export type ProactiveSecondaryCta = {
  enabled: boolean;
  label: string;
  href: string;
  kind: ProactiveSecondaryCtaKind;
};

export function normalizeProactiveSecondaryCtaKind(raw: unknown): ProactiveSecondaryCtaKind {
  const k = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (k === "whatsapp" || k === "link") return k;
  return "";
}

export function parseProactiveSecondaryCtaFromUi(
  ui: Record<string, unknown> | null | undefined,
): ProactiveSecondaryCta {
  const u = ui ?? {};
  const label = String(u.proactiveSecondaryCtaLabel ?? "").trim();
  const href = String(u.proactiveSecondaryCtaHref ?? "").trim();
  const kind = normalizeProactiveSecondaryCtaKind(u.proactiveSecondaryCtaKind);
  const enabled =
    u.proactiveSecondaryCtaEnabled === true && Boolean(label) && Boolean(href);
  return { enabled, label, href, kind };
}
