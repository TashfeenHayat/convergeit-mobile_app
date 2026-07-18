export interface VisitorInfoField {
  label: string;
  value: string;
  tone?: "default" | "accent";
}

export interface VisitorLocation {
  label: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface VisitorJourneyStep {
  url: string;
  at?: string;
}

export interface ParsedVisitorInfo {
  displayName: string;
  initials: string;
  contactFields: VisitorInfoField[];
  sessionFields: VisitorInfoField[];
  location: VisitorLocation | null;
  journey: VisitorJourneyStep[];
  currentPageUrl: string;
  sessionStartedAt: string;
  email: string;
  phone: string;
  browser: string;
  os: string;
  deviceType: string;
  raw: Record<string, unknown> | null;
}

function readString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return "";
}

function readNestedString(obj: Record<string, unknown>, path: string[]): string {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" && current.trim() ? current.trim() : "";
}

function readNumber(obj: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim()) {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function readNestedNumber(obj: Record<string, unknown>, path: string[]): number | undefined {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === "number" && Number.isFinite(current)) return current;
  if (typeof current === "string" && current.trim()) {
    const n = Number(current);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function readNestedObject(obj: Record<string, unknown>, path: string[]): Record<string, unknown> | null {
  let current: unknown = obj;
  for (const key of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[key];
  }
  return current && typeof current === "object" ? (current as Record<string, unknown>) : null;
}

function formatJourneyTime(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.trim();
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function parseJourneySteps(merged: Record<string, unknown>): VisitorJourneyStep[] {
  const session = readNestedObject(merged, ["session"]);
  const candidates = [
    merged.pageHistory,
    merged.pageViews,
    merged.pagesVisited,
    merged.journey,
    merged.navigation,
    merged.visitPath,
    session?.pageHistory,
    session?.journey,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const steps: VisitorJourneyStep[] = [];
    for (const item of candidate) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const url =
        readString(row, "url", "pageUrl", "path", "href", "currentPageUrl") || readNestedString(row, ["page", "url"]);
      if (!url) continue;
      steps.push({
        url,
        at: formatJourneyTime(row.visitedAt ?? row.timestamp ?? row.time ?? row.at ?? row.createdAt),
      });
    }
    if (steps.length > 0) return steps;
  }
  return [];
}

function buildLocationLabel(parts: string[]): string {
  return parts.filter(Boolean).join(", ");
}

function parseLocation(merged: Record<string, unknown>): VisitorLocation | null {
  const geo =
    (typeof merged.geo === "object" && merged.geo !== null ? (merged.geo as Record<string, unknown>) : null) ??
    (typeof merged.geolocation === "object" && merged.geolocation !== null
      ? (merged.geolocation as Record<string, unknown>)
      : null) ??
    readNestedObject(merged, ["location"]) ??
    readNestedObject(merged, ["session", "geo"]);

  const city =
    readString(merged, "locationCity", "location_city") ||
    readString(merged, "city") ||
    readNestedString(merged, ["location", "city"]) ||
    (geo ? readString(geo, "city", "locationCity") : "");
  const region =
    readString(merged, "locationRegion", "location_region") ||
    readString(merged, "region", "state", "province") ||
    readNestedString(merged, ["location", "region"]) ||
    (geo ? readString(geo, "region", "state") : "");
  const country =
    readString(merged, "locationCountry", "location_country") ||
    readString(merged, "country", "countryCode", "country_code") ||
    readNestedString(merged, ["location", "country"]) ||
    (geo ? readString(geo, "country", "countryCode") : "");

  const latitude =
    readNumber(merged, "latitude", "lat") ??
    readNestedNumber(merged, ["location", "latitude"]) ??
    readNestedNumber(merged, ["location", "lat"]) ??
    (geo ? readNumber(geo, "latitude", "lat") : undefined);

  const longitude =
    readNumber(merged, "longitude", "lng", "lon") ??
    readNestedNumber(merged, ["location", "longitude"]) ??
    readNestedNumber(merged, ["location", "lng"]) ??
    (geo ? readNumber(geo, "longitude", "lng", "lon") : undefined);

  const flatLocation = readString(merged, "location", "geoLocation", "geo_location");
  const label =
    buildLocationLabel([city, region, country].filter(Boolean)) ||
    flatLocation ||
    buildLocationLabel([city, country].filter(Boolean));

  if (!label && latitude == null && longitude == null) return null;

  return {
    label: label || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`,
    city: city || undefined,
    region: region || undefined,
    country: country || undefined,
    latitude,
    longitude,
  };
}

export function mergeVisitorPanelContext(
  visitor: Record<string, unknown> | null | undefined,
  history?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!visitor && !history) return null;
  const h = history ?? {};
  const v = visitor ?? {};
  const agent = typeof h.agent === "object" && h.agent !== null ? (h.agent as Record<string, unknown>) : null;
  const agentNameFromRelation = agent
    ? [agent.firstName, agent.lastName]
        .filter((part) => typeof part === "string" && part.trim())
        .join(" ")
        .trim() || readString(agent, "email")
    : "";

  const visitorTimezone = readString(h, "visitorTimezone", "visitor_timezone") || readString(v, "timezone", "visitorTimezone");
  const agentNameSnapshot = readString(h, "agentNameSnapshot", "agentName", "agent_name") || agentNameFromRelation;
  const agentTimezone =
    readString(h, "agentTimezone", "agent_timezone") ||
    readString(v, "agentTimezone", "agent_timezone") ||
    (agent ? readString(agent, "timezone") : "");

  return {
    ...v,
    visitorTimezone,
    timezone: visitorTimezone,
    agentNameSnapshot,
    agentTimezone,
    chatDurationSec: readNumber(h, "chatDurationSec", "chat_duration_sec") ?? readNumber(v, "chatDurationSec", "chat_duration_sec"),
    trafficSource: readString(h, "trafficSourceSnapshot", "traffic_source_snapshot") || readString(v, "trafficSource", "traffic_source"),
    sessionStartedAt: readString(h, "startedAt", "sessionStartedAt") || readString(v, "sessionStartedAt", "createdAt"),
    countryCode:
      readString(v, "countryCode", "country_code") ||
      (readString(v, "locationCountry", "location_country").length === 2
        ? readString(v, "locationCountry", "location_country").toUpperCase()
        : ""),
  };
}

export function parseVisitorInfo(
  visitor: Record<string, unknown> | null,
  conversationMeta?: Record<string, unknown>,
): ParsedVisitorInfo {
  const merged: Record<string, unknown> = {
    ...(conversationMeta ?? {}),
    ...(visitor ?? {}),
  };

  const name = readString(merged, "name", "visitorName", "fullName") || readNestedString(merged, ["profile", "name"]);
  const email = readString(merged, "email", "visitorEmail") || readNestedString(merged, ["profile", "email"]);
  const phone = readString(merged, "phone", "phoneNumber", "mobile") || readNestedString(merged, ["profile", "phone"]);
  const sessionId = readString(merged, "sessionId", "session_id", "visitorSessionId");
  const company = readString(merged, "company", "organization");
  const currentPageUrl =
    readString(merged, "currentPageUrl", "current_page_url", "pageUrl", "url") ||
    readNestedString(merged, ["session", "currentPageUrl"]);
  const referrer = readString(merged, "referrerUrl", "referrer", "referrer_url");
  const ip = readString(merged, "ip", "ipAddress", "ip_address");
  const browser = readString(merged, "browser", "userAgent", "user_agent");
  const os = readString(merged, "os", "operatingSystem");
  const deviceType = readString(merged, "device", "deviceType", "device_type");
  const timezone = readString(merged, "timezone", "visitorTimezone", "visitor_timezone");
  const agentTimezone = readString(merged, "agentTimezone", "agent_timezone");
  const agentName = readString(merged, "agentNameSnapshot", "agentName", "agent_name");
  const trafficSource = readString(merged, "trafficSource", "traffic_source", "trafficSourceSnapshot");
  const zipcode = readString(merged, "locationZipcode", "zipcode", "location_zipcode");
  const region = readString(merged, "locationRegion", "region", "location_region");
  const countryCode = readString(merged, "countryCode", "country_code");
  const chatDurationSec = readNumber(merged, "chatDurationSec", "chat_duration_sec");
  const sessionStartedAt =
    readString(merged, "sessionStartedAt", "startedAt", "createdAt", "session_started_at") ||
    readNestedString(merged, ["session", "startedAt"]);

  const location = parseLocation(merged);
  const journey = parseJourneySteps(merged);

  const displayName = name || email || (sessionId ? `Visitor ${sessionId.slice(0, 8)}` : "Visitor");
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "V";

  const contactFields: VisitorInfoField[] = [
    { label: "Name", value: name || "—" },
    { label: "Email", value: email || "—", tone: email ? "accent" : "default" },
    { label: "Phone", value: phone || "—" },
    { label: "Company", value: company || "—" },
  ];

  const durationLabel = chatDurationSec != null && chatDurationSec > 0 ? `${Math.max(1, Math.round(chatDurationSec / 60))} min` : "—";

  const sessionFields: VisitorInfoField[] = [
    { label: "Session ID", value: sessionId || "—" },
    {
      label: "Started at",
      value: sessionStartedAt
        ? new Date(sessionStartedAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "—",
    },
    { label: "Chat duration", value: durationLabel },
    { label: "Traffic source", value: trafficSource || "—" },
    { label: "Referrer", value: referrer || "—" },
    { label: "IP address", value: ip || "—" },
    { label: "Country code", value: countryCode || "—" },
    { label: "Region", value: region || "—" },
    { label: "Zipcode", value: zipcode || "—" },
    { label: "Visitor timezone", value: timezone || "—" },
    { label: "Agent", value: agentName || "—" },
    { label: "Agent timezone", value: agentTimezone || "—" },
    { label: "Browser", value: browser || "—" },
    { label: "OS", value: os || "—" },
    { label: "Device", value: deviceType || "—" },
  ];

  return {
    displayName,
    initials,
    contactFields,
    sessionFields,
    location,
    journey,
    currentPageUrl,
    sessionStartedAt,
    email,
    phone,
    browser,
    os,
    deviceType,
    raw: visitor,
  };
}
