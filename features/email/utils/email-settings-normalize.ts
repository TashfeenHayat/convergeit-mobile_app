export function resolveProviderKind(provider: {
  providerType?: string;
  type?: string;
  code?: string;
}): "smtp" | "api" | null {
  const t = (provider.providerType ?? provider.type)?.toLowerCase();
  if (t === "smtp" || t === "api") return t;
  const code = String(provider.code ?? "").toLowerCase();
  if (code === "smtp" || code.includes("smtp")) return "smtp";
  if (
    code.includes("api") ||
    code.includes("sendgrid") ||
    code.includes("mailgun") ||
    code.includes("microsoft")
  ) {
    return "api";
  }
  return null;
}
