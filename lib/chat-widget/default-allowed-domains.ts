/** Merge wizard-entered domains with the current dashboard host (dev embed testing). */
export function mergeDraftAllowedDomains(domains: string[]): string[] {
  const out = new Set(
    domains.map((d) => d.trim().toLowerCase()).filter(Boolean),
  );
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname.trim().toLowerCase();
    if (host) out.add(host);
    const port = window.location.port?.trim();
    if (host && port) out.add(`${host}:${port}`);
  }
  return [...out];
}
