const DEFAULT_MAX_LEN = 56;

/** Strip protocol, query, and hash for compact UI (UTM links stay in `title` / copy). */
export function formatWebsiteDisplayUrl(
  raw?: string | null,
  maxLength = DEFAULT_MAX_LEN,
): string {
  const s = String(raw ?? "").trim();
  if (!s || s === "—") return "—";

  let compact = s;
  try {
    const parsed = new URL(s.includes("://") ? s : `https://${s}`);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    compact = `${parsed.hostname}${path}`.replace(/^www\./i, "");
  } catch {
    compact = s.split(/[?#]/)[0]?.replace(/^https?:\/\//i, "").replace(/^www\./i, "") ?? s;
  }

  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(1, maxLength - 1))}…`;
}

export type WebsiteRowUrlLabels = {
  /** Bold primary line in tables */
  primary: string;
  /** Muted second line; null when it would duplicate primary */
  secondary: string | null;
  /** Full URL for tooltips and links */
  full: string;
};

function normalizeComparableUrl(value: string): string {
  const v = value.trim().toLowerCase();
  if (!v) return "";
  try {
    const parsed = new URL(v.includes("://") ? v : `https://${v}`);
    return `${parsed.hostname}${parsed.pathname}`.replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return v.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[?#]/)[0] ?? v;
  }
}

/** Table/card labels: avoid showing the same long URL twice as name + subtitle. */
export function resolveWebsiteRowUrlLabels(
  name?: string | null,
  url?: string | null,
): WebsiteRowUrlLabels {
  const full = String(url ?? "").trim() || "—";
  const display = formatWebsiteDisplayUrl(full);
  const n = String(name ?? "").trim();

  if (!n) {
    return {
      primary: display !== "—" ? display : "Website",
      secondary: null,
      full,
    };
  }

  if (full === "—") {
    return { primary: n, secondary: null, full };
  }

  const nameNorm = normalizeComparableUrl(n);
  const urlNorm = normalizeComparableUrl(full);
  if (nameNorm && urlNorm && (nameNorm === urlNorm || full.includes(n) || n.includes(urlNorm))) {
    return { primary: display, secondary: null, full };
  }

  return { primary: n, secondary: display, full };
}
