/** Shared validation for widget wizard inputs (mirrors backend rules). */

const URL_PROTOCOL = /^https?:\/\//i;

export function normalizeSingleUrlInput(raw: string): string {
  return raw.trim();
}

export function validateSingleHttpUrl(
  raw: string,
  options?: { required?: boolean; label?: string },
): string | null {
  const label = options?.label ?? "URL";
  const value = normalizeSingleUrlInput(raw);
  if (!value) {
    return options?.required ? `${label} is required.` : null;
  }
  if (!URL_PROTOCOL.test(value)) {
    return `${label} must start with http:// or https://`;
  }
  if (/\s/.test(value)) {
    return `${label} must be a single link (no spaces).`;
  }
  const parts = value.split(/https?:\/\//i).filter(Boolean);
  if (parts.length > 1) {
    return `Enter only one ${label.toLowerCase()}.`;
  }
  try {
    const u = new URL(value);
    if (!u.hostname) return `Enter a valid ${label.toLowerCase()}.`;
  } catch {
    return `Enter a valid ${label.toLowerCase()}.`;
  }
  return null;
}

export function validateVideoEmbedUrl(raw: string): string | null {
  const value = normalizeSingleUrlInput(raw);
  if (!value) return null;
  const base = validateSingleHttpUrl(value, { label: "Video URL" });
  if (base) return base;
  const lower = value.toLowerCase();
  const ok =
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com");
  if (!ok) {
    return "Use a YouTube or Vimeo link.";
  }
  return null;
}

/** Hostnames only — strips paths and rejects full URLs pasted as domains. */
export function parseDomainListInput(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .map((part) => {
      if (!part) return "";
      if (URL_PROTOCOL.test(part)) {
        try {
          const u = new URL(part);
          const host = u.hostname.toLowerCase();
          return u.port ? `${host}:${u.port}` : host;
        } catch {
          return "";
        }
      }
      return part.replace(/^\/+|\/+$/g, "").split("/")[0]?.toLowerCase() ?? "";
    })
    .filter(Boolean);
}

const DOMAIN_HOST_RE =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function isValidIpv4(host: string): boolean {
  if (!IPV4_RE.test(host)) return false;
  return host.split(".").every((octet) => {
    const n = Number.parseInt(octet, 10);
    return n >= 0 && n <= 255;
  });
}

/** Allow production domains plus local dev hosts (localhost, 127.0.0.1) with optional port. */
export function isValidAllowedDomainHost(host: string): boolean {
  const lower = host.trim().toLowerCase();
  if (!lower) return false;

  const portMatch = /^(.+):(\d{1,5})$/.exec(lower);
  const hostname = portMatch?.[1] ?? lower;
  const port = portMatch ? Number.parseInt(portMatch[2]!, 10) : null;
  if (port !== null && (port < 1 || port > 65535)) return false;

  if (hostname === "localhost") return true;
  if (isValidIpv4(hostname)) return true;
  return DOMAIN_HOST_RE.test(hostname);
}

export function formatDomainListForInput(domains: string[]): string {
  return domains.map((d) => d.trim()).filter(Boolean).join(", ");
}

export function validateDomainListInput(raw: string): string | null {
  const parts = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    if (/\s/.test(part) && !part.includes(".")) {
      return "Use hostnames like example.com — one per comma.";
    }
    const host = parseDomainListInput(part)[0];
    if (!host) continue;
    if (host.includes(" ")) {
      return "Domains cannot contain spaces.";
    }
    if (!isValidAllowedDomainHost(host)) {
      return `Invalid domain: ${part}`;
    }
  }
  return null;
}

export function clampIntegerString(
  raw: string,
  min: number,
  max: number,
): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const n = Math.min(max, Math.max(min, Number.parseInt(digits, 10)));
  return String(n);
}

export const FIELD_MAX = {
  shortLabel: 80,
  title: 120,
  message: 500,
  placeholder: 120,
  url: 2048,
  domainList: 2000,
} as const;
