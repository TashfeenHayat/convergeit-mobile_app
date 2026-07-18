export type ClientGeoHints = {
  clientTimezone?: string;
  clientLocale?: string;
  clientScreenResolution?: string;
  clientLocationCity?: string;
  clientLocationCountry?: string;
  clientLocationRegion?: string;
  clientLocationZipcode?: string;
};

type BigDataCloudClientGeo = {
  countryCode?: string;
  countryName?: string;
  city?: string;
  postcode?: string;
  principalSubdivision?: string;
};

const GEO_CACHE_KEY = "converge:widget:client-geo:v1";
let inflight: Promise<ClientGeoHints> | null = null;

function readLocaleCountry(locale: string | undefined): string | undefined {
  if (!locale?.includes("-")) return undefined;
  const part = locale.split("-")[1]?.trim().toUpperCase();
  return part && part.length === 2 ? part : undefined;
}

function baseHints(): ClientGeoHints {
  const clientTimezone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : undefined;
  const clientLocale =
    typeof navigator !== "undefined" ? navigator.language : undefined;
  const clientScreenResolution =
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : undefined;
  const localeCountry = readLocaleCountry(clientLocale);

  return {
    clientTimezone,
    clientLocale,
    clientScreenResolution,
    clientLocationCountry: localeCountry,
  };
}

function readCachedGeo(): ClientGeoHints | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(GEO_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientGeoHints;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedGeo(hints: ClientGeoHints) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(hints));
  } catch {
    /* ignore quota */
  }
}

async function fetchBigDataCloudClientGeo(): Promise<Partial<ClientGeoHints>> {
  try {
    const res = await fetch("https://api.bigdatacloud.net/data/reverse-geocode-client", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const json = (await res.json()) as BigDataCloudClientGeo;
    return {
      clientLocationCity: json.city?.trim() || undefined,
      clientLocationCountry:
        json.countryCode?.trim().toUpperCase() ||
        json.countryName?.trim() ||
        undefined,
      clientLocationRegion: json.principalSubdivision?.trim() || undefined,
      clientLocationZipcode: json.postcode?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

/** Best-effort visitor geo hints for widget analytics and chat create (no permission prompt). */
export async function resolveClientGeoHints(): Promise<ClientGeoHints> {
  const cached = readCachedGeo();
  if (cached) return cached;

  if (inflight) return inflight;

  inflight = (async () => {
    const merged: ClientGeoHints = {
      ...baseHints(),
      ...(await fetchBigDataCloudClientGeo()),
    };
    writeCachedGeo(merged);
    return merged;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function peekClientGeoHints(): ClientGeoHints {
  return readCachedGeo() ?? baseHints();
}
