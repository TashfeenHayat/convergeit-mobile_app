import type { EmailProvider, EmailProviderKind } from "../types";
import { resolveProviderKind } from "./email-settings-normalize";

const KIND_ORDER: EmailProviderKind[] = ["api", "smtp"];

export function groupProvidersByKind(
  providers: EmailProvider[],
): { kind: EmailProviderKind; providers: EmailProvider[] }[] {
  const buckets = new Map<EmailProviderKind, EmailProvider[]>();
  for (const p of providers) {
    const kind = resolveProviderKind(p) ?? "api";
    const list = buckets.get(kind) ?? [];
    list.push(p);
    buckets.set(kind, list);
  }
  return KIND_ORDER.filter((k) => buckets.has(k)).map((kind) => ({
    kind,
    providers: buckets.get(kind)!,
  }));
}
