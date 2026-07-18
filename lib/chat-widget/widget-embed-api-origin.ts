function originOf(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function originsMatch(a: string, b: string): boolean {
  if (!a.trim() || !b.trim()) return false;
  const ao = originOf(a);
  const bo = originOf(b);
  return Boolean(ao && bo && ao === bo);
}

/** Browser-visible Nest API origin (no trailing slash). */
export function resolveWidgetApiOrigin(): string {
  const raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "";

  if (raw) return normalizeOrigin(raw);

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeOrigin(window.location.origin);
  }

  return "https://your-api.example";
}

export type ResolveWidgetEmbedAppOriginOptions = {
  /** Live browser origin — wins over stale NEXT_PUBLIC_WIDGET_EMBED_ORIGIN on preview/test pages. */
  browserOrigin?: string;
  /** Server-provided embed host from GET embed-snippet (when not the API). */
  apiEmbedAppOrigin?: string;
};

/**
 * Dashboard / Next host for `widget.js` + iframe `/embed/widget`.
 * Must never be the Nest API host — `/embed/widget` only exists on Next.js.
 */
export function resolveWidgetEmbedAppOrigin(
  options?: ResolveWidgetEmbedAppOriginOptions,
): string {
  const apiOrigin = resolveWidgetApiOrigin();

  const apiHint = options?.apiEmbedAppOrigin?.trim() ?? "";
  if (apiHint && !originsMatch(apiHint, apiOrigin)) {
    return normalizeOrigin(apiHint);
  }

  const explicitBrowser = options?.browserOrigin?.trim() ?? "";
  if (explicitBrowser) {
    const loc = normalizeOrigin(explicitBrowser);
    if (loc && !originsMatch(loc, apiOrigin)) {
      return loc;
    }
  }

  const envCandidates = [
    process.env.NEXT_PUBLIC_WIDGET_EMBED_ORIGIN?.trim(),
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
  ].filter(Boolean) as string[];

  for (const raw of envCandidates) {
    const embed = normalizeOrigin(raw);
    if (embed && !originsMatch(embed, apiOrigin)) {
      return embed;
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    const loc = normalizeOrigin(window.location.origin);
    if (loc && !originsMatch(loc, apiOrigin)) {
      return loc;
    }
  }

  return "";
}

export type WidgetEmbedArchitecture = {
  appOrigin: string;
  apiOrigin: string;
  scriptSrc: string;
  cdnOrigin: string | null;
  embedOriginMisconfigured: boolean;
};

/** Optional CDN host for widget.js only (Phase 1C). */
export function resolveWidgetCdnOrigin(): string | null {
  const raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_WIDGET_CDN_ORIGIN?.trim()) ||
    "";
  return raw ? normalizeOrigin(raw) : null;
}

/** Loader script URL: CDN override, else app origin. */
export function resolveWidgetLoaderScriptUrl(
  options?: ResolveWidgetEmbedAppOriginOptions,
): string {
  const cdn = resolveWidgetCdnOrigin();
  if (cdn) return `${cdn}/widget.js`;
  const app = resolveWidgetEmbedAppOrigin(options);
  return app ? `${app}/widget.js` : "";
}

/** SaaS split: UI on app origin, data on API origin. */
export function resolveWidgetEmbedArchitecture(
  options?: ResolveWidgetEmbedAppOriginOptions,
): WidgetEmbedArchitecture {
  const apiOrigin = resolveWidgetApiOrigin();
  const appOrigin = resolveWidgetEmbedAppOrigin(options);
  const cdnOrigin = resolveWidgetCdnOrigin();
  const scriptSrc = resolveWidgetLoaderScriptUrl(options);
  const envEmbed = process.env.NEXT_PUBLIC_WIDGET_EMBED_ORIGIN?.trim() ?? "";
  const embedOriginMisconfigured = Boolean(
    envEmbed && originsMatch(envEmbed, apiOrigin),
  );
  return { appOrigin, apiOrigin, scriptSrc, cdnOrigin, embedOriginMisconfigured };
}

/**
 * Customer-site embed: iframe loader on dashboard host (same UI as admin preview).
 * `/embed/widget` loads config/session from NEXT_PUBLIC_API_BASE_URL.
 */
export function buildVisitorWidgetEmbedScript(input: {
  widgetKey: string;
  appOrigin?: string;
  apiEmbedAppOrigin?: string;
}): string {
  const app = (
    input.appOrigin ??
    resolveWidgetEmbedAppOrigin({
      apiEmbedAppOrigin: input.apiEmbedAppOrigin,
      browserOrigin:
        typeof window !== "undefined" ? window.location.origin : undefined,
    })
  ).replace(/\/+$/, "");
  const key = input.widgetKey.trim();
  const api = resolveWidgetApiOrigin().replace(/\/+$/, "");
  const scriptSrc = resolveWidgetLoaderScriptUrl({
    apiEmbedAppOrigin: input.apiEmbedAppOrigin ?? app,
    browserOrigin:
      typeof window !== "undefined" ? window.location.origin : undefined,
  });
  if (!app || !scriptSrc) {
    return `<!-- Converge widget — set NEXT_PUBLIC_WIDGET_EMBED_ORIGIN to your Next.js app URL (not the API) -->
<script src="YOUR_APP_ORIGIN/widget.js" data-widget-key="${key}" data-app-origin="YOUR_APP_ORIGIN" data-api-origin="YOUR_API_ORIGIN" defer></script>`;
  }
  const apiAttr = api ? `\n  data-api-origin="${api}"` : "";
  return `<!-- Converge widget — page views tracked on script load; chat iframe loads separately -->
<script src="${scriptSrc}" data-widget-key="${key}" data-app-origin="${app}"${apiAttr} defer></script>`;
}

/** @deprecated Alias — use {@link buildVisitorWidgetEmbedScript}. */
export function buildApiWidgetEmbedScript(input: {
  widgetKey: string;
  apiOrigin?: string;
  appOrigin?: string;
  apiEmbedAppOrigin?: string;
}) {
  return buildVisitorWidgetEmbedScript({
    widgetKey: input.widgetKey,
    appOrigin: input.appOrigin ?? input.apiOrigin,
    apiEmbedAppOrigin: input.apiEmbedAppOrigin,
  });
}

/** Normalize saved snippets to current app-origin iframe embed. */
export function normalizeEmbedSnippetForApi(
  snippet: string,
  appOrigin: string,
): string {
  const app = appOrigin.trim().replace(/\/+$/, "");
  if (!app || !snippet.trim()) return snippet;

  const apiOrigin = resolveWidgetApiOrigin();
  const apiO = originOf(apiOrigin);
  const appO = originOf(app);

  let out = snippet;
  out = out.replace(/(\ssrc=")([^"]*\/widget\.js)(")/gi, (_m, p1, src, p3) => {
    const srcOrigin = originOf(String(src));
    if (apiO && srcOrigin === apiO && appO) {
      return `${p1}${app}/widget.js${p3}`;
    }
    return `${p1}${app}/widget.js${p3}`;
  });
  out = out.replace(/(data-app-origin=")([^"]*)(")/gi, `$1${app}$3`);
  if (apiOrigin) {
    if (/\sdata-api-origin="/i.test(out)) {
      out = out.replace(/(data-api-origin=")([^"]*)(")/gi, `$1${apiOrigin}$3`);
    } else {
      out = out.replace(/(<script[^>]*)/i, `$1 data-api-origin="${apiOrigin}"`);
    }
  }
  return out;
}
