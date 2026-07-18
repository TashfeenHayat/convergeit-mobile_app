import { getResolvedPublicApiBaseUrl } from "@/lib/public-api/resolved-base-url";
import type { WidgetEmbedEnv } from "./widget-embed-env";
import { WIDGET_FETCH_CREDENTIALS } from "./widget-fetch-credentials";
import {
  configRecordFromEnvelope,
  hydrateExperienceInquiryFromBehavior,
  parseWidgetExperienceV1,
} from "./widget-experience";
import type {
  AiVisitorRespondRequest,
  AiVisitorRespondResponse,
  WidgetConfigEnvelope,
  WidgetFeatureFlagsDto,
  WidgetSessionRequest,
  WidgetSessionResponse,
  WidgetSurfacesDto,
} from "./widget-types";

/**
 * Backend often wraps JSON as `{ success: true, data: ... }`; sometimes nested once.
 */
function peelSuccessEnvelope(raw: unknown, maxDepth = 4): unknown {
  let cur: unknown = raw;
  for (let d = 0; d < maxDepth; d++) {
    if (cur === null || typeof cur !== "object" || Array.isArray(cur)) break;
    const o = cur as Record<string, unknown>;
    const success = o.success;
    if (
      (success === true || success === "true") &&
      "data" in o &&
      o.data !== null &&
      typeof o.data === "object"
    ) {
      cur = o.data;
      continue;
    }
    break;
  }
  return cur;
}

function parseAiVisitorRespondResponse(raw: unknown): AiVisitorRespondResponse {
  const peeled = peelSuccessEnvelope(raw);
  const o =
    peeled !== null && typeof peeled === "object" && !Array.isArray(peeled)
      ? (peeled as Record<string, unknown>)
      : {};

  const str = (v: unknown): string => (typeof v === "string" ? v : "");

  const response =
    str(o.response) ||
    str(o.reply) ||
    str(o.output) ||
    str(o.suggestedReply) ||
    str(o.suggested_reply) ||
    str(o.assistantMessage) ||
    str(o.assistant_message) ||
    str(o.message) ||
    str(o.text) ||
    str(o.answer) ||
    str(o.content) ||
    str(o.body) ||
    (typeof o.result === "string" ? str(o.result) : "");

  const intent = typeof o.intent === "string" ? o.intent : undefined;
  const shouldEscalate =
    typeof o.shouldEscalate === "boolean"
      ? o.shouldEscalate
      : typeof o.should_escalate === "boolean"
        ? o.should_escalate
        : undefined;

  const km = o.knowledgeMatches ?? o.knowledge_matches;
  const knowledgeMatches = Array.isArray(km)
    ? (km as NonNullable<AiVisitorRespondResponse["knowledgeMatches"]>)
    : undefined;

  const topRaw = o.topKnowledgeMatch ?? o.top_knowledge_match;
  const topKnowledgeMatch =
    topRaw && typeof topRaw === "object" && !Array.isArray(topRaw)
      ? (topRaw as NonNullable<AiVisitorRespondResponse["topKnowledgeMatch"]>)
      : undefined;

  return { response, intent, shouldEscalate, knowledgeMatches, topKnowledgeMatch };
}

function coerceSurfaces(input: unknown): WidgetSurfacesDto {
  return input !== null && typeof input === "object"
    ? (input as WidgetSurfacesDto)
    : {};
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/** Deep-merge `theme.designJson.chat` so partial publishes still apply launcher + chat box. */
function mergeThemeDesignJson(
  base: Record<string, unknown>,
  next: Record<string, unknown>,
): Record<string, unknown> {
  const ta = isRecord(base.theme) ? base.theme : {};
  const tb = isRecord(next.theme) ? next.theme : {};
  const dja = isRecord(ta.designJson) ? ta.designJson : {};
  const djb = isRecord(tb.designJson) ? tb.designJson : {};
  const cha = isRecord(dja.chat) ? dja.chat : {};
  const chb = isRecord(djb.chat) ? djb.chat : {};
  const launchA = isRecord(cha.launcher) ? cha.launcher : {};
  const launchB = isRecord(chb.launcher) ? chb.launcher : {};
  const boxA = isRecord(cha.chatBox) ? cha.chatBox : {};
  const boxB = isRecord(chb.chatBox) ? chb.chatBox : {};
  const colorsA = isRecord(cha.colors) ? cha.colors : {};
  const colorsB = isRecord(chb.colors) ? chb.colors : {};

  const mergedDj: Record<string, unknown> = {
    ...dja,
    ...djb,
    chat: {
      ...cha,
      ...chb,
      launcher: { ...launchA, ...launchB },
      chatBox: { ...boxA, ...boxB },
      colors: { ...colorsA, ...colorsB },
    },
  };

  const merged: Record<string, unknown> = {
    ...base,
    ...next,
    theme: {
      ...ta,
      ...tb,
      designJson: mergedDj,
    },
  };

  if (isRecord(mergedDj.ui)) merged.ui = { ...(isRecord(merged.ui) ? merged.ui : {}), ...mergedDj.ui };
  if (isRecord(mergedDj.form)) merged.form = { ...(isRecord(merged.form) ? merged.form : {}), ...mergedDj.form };
  if (isRecord(mergedDj.behavior)) {
    merged.behavior = { ...(isRecord(merged.behavior) ? merged.behavior : {}), ...mergedDj.behavior };
  }
  if (isRecord(mergedDj.response)) {
    merged.response = { ...(isRecord(merged.response) ? merged.response : {}), ...mergedDj.response };
  }

  return merged;
}

function mergeWidgetConfigParts(...parts: unknown[]): Record<string, unknown> {
  let out: Record<string, unknown> = {};
  for (const part of parts) {
    if (!isRecord(part)) continue;
    const settingsJson = part.settingsJson;
    const withoutSettings = { ...part };
    delete withoutSettings.settingsJson;
    out = mergeThemeDesignJson(out, withoutSettings);
    if (isRecord(settingsJson)) {
      out = mergeThemeDesignJson(out, settingsJson);
    }
  }
  return out;
}

/**
 * Normalize public `/widget/config/:key` (and similar) into a full envelope with merged `config`.
 */
export function normalizePublicWidgetConfigEnvelope(
  raw: unknown,
  widgetKeyFallback: string,
): WidgetConfigEnvelope {
  const o = isRecord(raw) ? raw : {};

  const experience =
    parseWidgetExperienceV1(o.experience) ??
    parseWidgetExperienceV1(isRecord(o.clientSettings) ? o.clientSettings._experience : null);

  const legacyInquiryConfig = mergeWidgetConfigParts(
    o.config,
    o.configSnapshot,
    o.publishedConfig,
  );
  const experienceWithLegacyInquiry =
    experience && isRecord(legacyInquiryConfig.behavior)
      ? hydrateExperienceInquiryFromBehavior({
          ...experience,
          behavior: {
            ...(isRecord(experience.behavior) ? experience.behavior : {}),
            ...legacyInquiryConfig.behavior,
          },
        })
      : experience;

  const configParts: unknown[] = experienceWithLegacyInquiry
    ? []
    : [o.config, o.configSnapshot, o.publishedConfig, o.settingsJson];

  const themeDesignJson = isRecord(o.themeDesignJson)
    ? o.themeDesignJson
    : isRecord(o.theme_design_json)
      ? o.theme_design_json
      : undefined;

  const textUsFormConfig = isRecord(o.textUsFormConfig)
    ? o.textUsFormConfig
    : isRecord(o.text_us_form_config)
      ? o.text_us_form_config
      : undefined;

  let mergedConfig = experienceWithLegacyInquiry
    ? configRecordFromEnvelope({
        experience: experienceWithLegacyInquiry,
        themeDesignJson,
        textUsFormConfig,
        chatMode:
          typeof o.chatMode === "string"
            ? o.chatMode
            : typeof o.chat_mode === "string"
              ? o.chat_mode
              : undefined,
      })
    : mergeWidgetConfigParts(...configParts);

  if (!experienceWithLegacyInquiry && isRecord(mergedConfig.theme)) {
    const theme = mergedConfig.theme;
    const dj = isRecord(theme.designJson) ? theme.designJson : null;
    if (dj) {
      const overlay = (key: string) => {
        const fromDj = dj[key];
        if (!isRecord(fromDj)) return;
        const existing = mergedConfig[key];
        mergedConfig[key] = isRecord(existing) ? { ...fromDj, ...existing } : { ...fromDj };
      };
      overlay("ui");
      overlay("form");
      overlay("behavior");
      overlay("response");
      overlay("session");
    }
  }

  if (Object.keys(mergedConfig).length === 0) {
    const skip = new Set([
      "widgetKey",
      "widget_key",
      "websiteId",
      "website_id",
      "widgetType",
      "widget_type",
      "surfaces",
      "featureFlags",
      "feature_flags",
      "status",
      "embedAllowAnyOrigin",
      "embed_allow_any_origin",
      "allowedDomains",
      "allowed_domains",
      "chatMode",
      "chat_mode",
      "success",
      "data",
      "configSnapshot",
      "publishedConfig",
      "themeDesignJson",
      "theme_design_json",
      "experience",
      "embed",
      "clientSettings",
    ]);
    const rest: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(o)) {
      if (!skip.has(k)) rest[k] = v;
    }
    if (rest.theme || rest.ui || rest.form || rest.behavior || rest.mode) {
      mergedConfig = mergeWidgetConfigParts(rest);
    }
  }

  const chatMode =
    (typeof o.chatMode === "string" ? o.chatMode : undefined) ??
    (typeof o.chat_mode === "string" ? o.chat_mode : undefined) ??
    (typeof mergedConfig.mode === "string" ? mergedConfig.mode : undefined) ??
    (typeof mergedConfig.chatMode === "string" ? mergedConfig.chatMode : undefined);

  const featureFlags = isRecord(o.featureFlags)
    ? (o.featureFlags as WidgetFeatureFlagsDto)
    : isRecord(o.feature_flags)
      ? (o.feature_flags as WidgetFeatureFlagsDto)
      : {};

  const embedRaw = isRecord(o.embed) ? o.embed : null;

  return {
    widgetKey: String(o.widgetKey ?? o.widget_key ?? widgetKeyFallback),
    websiteId: String(o.websiteId ?? o.website_id ?? ""),
    widgetType: String(o.widgetType ?? o.widget_type ?? "CHAT"),
    surfaces: coerceSurfaces(o.surfaces),
    featureFlags,
    embedAllowAnyOrigin:
      o.embedAllowAnyOrigin === true || o.embed_allow_any_origin === true,
    status: String(o.status ?? "active"),
    allowedDomains: Array.isArray(o.allowedDomains)
      ? (o.allowedDomains as string[])
      : Array.isArray(o.allowed_domains)
        ? (o.allowed_domains as string[])
        : undefined,
    chatMode,
    experience: experienceWithLegacyInquiry ?? undefined,
    embed: embedRaw
      ? {
          appOrigin:
            typeof embedRaw.appOrigin === "string" ? embedRaw.appOrigin : null,
          apiOrigin:
            typeof embedRaw.apiOrigin === "string" ? embedRaw.apiOrigin : null,
          scriptSrc:
            typeof embedRaw.scriptSrc === "string" ? embedRaw.scriptSrc : null,
          cdnOrigin:
            typeof embedRaw.cdnOrigin === "string" ? embedRaw.cdnOrigin : null,
        }
      : undefined,
    clientSettings: isRecord(o.clientSettings) ? o.clientSettings : undefined,
    themeDesignJson,
    textUsFormConfig,
    /** Legacy fat snapshot; omitted when API returns `experience` only. */
    config:
      !experienceWithLegacyInquiry && Object.keys(mergedConfig).length > 0
        ? mergedConfig
        : undefined,
  };
}

/** Normalize POST /widget/session body — token field names vary by API version. */
function parseWidgetSessionResponse(peeled: unknown): WidgetSessionResponse | null {
  if (!peeled || typeof peeled !== "object" || Array.isArray(peeled)) return null;
  const r = peeled as Record<string, unknown>;
  const tokenCandidates = [
    r.sessionToken,
    r.session_token,
    r.token,
    r.jwt,
    r.bearerToken,
    r.bearer_token,
  ];
  let sessionToken = "";
  for (const c of tokenCandidates) {
    if (typeof c === "string" && c.trim()) {
      sessionToken = c.trim();
      break;
    }
  }
  if (!sessionToken) return null;

  return {
    tokenType: String(r.tokenType ?? r.token_type ?? "Bearer"),
    sessionToken,
    expiresIn: String(r.expiresIn ?? r.expires_in ?? ""),
    widgetKey: String(r.widgetKey ?? r.widget_key ?? ""),
    websiteId: String(r.websiteId ?? r.website_id ?? ""),
    widgetType: String(r.widgetType ?? r.widget_type ?? ""),
    surfaces: coerceSurfaces(r.surfaces),
  };
}

async function fetchJsonPublic<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const base = getResolvedPublicApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...init,
      credentials: WIDGET_FETCH_CREDENTIALS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!res.ok) {
      let message = `${res.status} ${res.statusText}`;
      try {
        const maybe = await res.json();
        if (maybe?.message && typeof maybe.message === "string")
          message = maybe.message;
        if (maybe?.error && typeof maybe.error === "string")
          message = maybe.error;
      } catch {
        /* ignore parse */
      }
      return { ok: false, status: res.status, message };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      message: e instanceof Error ? e.message : "Network error",
    };
  }
}

export async function getWidgetRuntimeConfig(widgetKey: string) {
  const result = await fetchJsonPublic<unknown>(
    `/widget/config/${encodeURIComponent(widgetKey)}`,
    { method: "GET" },
  );
  if (!result.ok) return result;
  const peeled = peelSuccessEnvelope(result.data);
  const normalized = normalizePublicWidgetConfigEnvelope(peeled, widgetKey);
  return { ok: true as const, data: normalized };
}

export async function getWidgetPublicPreviewRuntimeConfig(
  widgetKey: string,
  previewShareToken: string,
) {
  const token = previewShareToken.trim();
  const result = await fetchJsonPublic<unknown>(
    `/widget/preview-config/${encodeURIComponent(widgetKey)}?token=${encodeURIComponent(token)}`,
    { method: "GET" },
  );
  if (!result.ok) return result;
  const peeled = peelSuccessEnvelope(result.data);
  const normalized = normalizePublicWidgetConfigEnvelope(peeled, widgetKey);
  return { ok: true as const, data: normalized };
}

/**
 * Dashboard sandbox uses authenticated draft preview; production/staging use public published config.
 */
export async function getWidgetRuntimeConfigForEmbed(
  widgetKey: string,
  embedEnv: WidgetEmbedEnv,
  options?: { previewShareToken?: string },
) {
  if (embedEnv === "dashboard_preview") {
    const shareToken = options?.previewShareToken?.trim();
    if (shareToken) {
      return getWidgetPublicPreviewRuntimeConfig(widgetKey, shareToken);
    }

    try {
      const { getWidgetDraftPreviewEmbedConfig } = await import(
        "@/api/widgets/widgets.api"
      );
      const raw = await getWidgetDraftPreviewEmbedConfig(widgetKey);
      const peeled = peelSuccessEnvelope(raw);
      const normalized = normalizePublicWidgetConfigEnvelope(peeled, widgetKey);
      return { ok: true as const, data: normalized };
    } catch (e) {
      const axiosErr = e as {
        response?: { status?: number; data?: { message?: string; error?: string } };
      };
      const status = axiosErr.response?.status ?? 0;
      const body = axiosErr.response?.data;
      const message =
        (typeof body?.message === "string" ? body.message : null) ??
        (typeof body?.error === "string" ? body.error : null) ??
        (e instanceof Error ? e.message : "Failed to load preview config");
      if (status === 401 || status === 403) {
        return {
          ok: false as const,
          status,
          message:
            status === 401
              ? "Sign in to the dashboard to preview your saved draft."
              : message,
        };
      }
      return { ok: false as const, status, message: String(message) };
    }
  }
  return getWidgetRuntimeConfig(widgetKey);
}

export async function postWidgetSession(body: WidgetSessionRequest) {
  const payload: Record<string, unknown> = { widgetKey: body.widgetKey };
  const originHost = body.originHost?.trim();
  if (originHost) payload.originHost = originHost;
  const previewShareToken = body.previewShareToken?.trim();
  if (previewShareToken) payload.previewShareToken = previewShareToken;

  const result = await fetchJsonPublic<unknown>(`/widget/session`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!result.ok) return result;
  const peeled = peelSuccessEnvelope(result.data);
  const parsed = parseWidgetSessionResponse(peeled);
  if (!parsed) {
    return {
      ok: false as const,
      status: 200,
      message: "Session token missing from server response.",
    };
  }
  return { ok: true as const, data: parsed };
}

/** Public AI reply for embedded widget visitor. Uses widget bearer when provided. */
function buildVisitorRespondJsonBody(body: AiVisitorRespondRequest): Record<string, unknown> {
  const out: Record<string, unknown> = {
    message: body.message,
    widgetKey: body.widgetKey,
    originHost: body.originHost,
  };
  const wid = body.websiteId?.trim();
  if (wid) out.websiteId = wid;
  const cid = body.conversationId?.trim();
  if (cid) out.conversationId = cid;
  const page = body.currentPageUrl?.trim();
  if (page) out.currentPageUrl = page;
  return out;
}

export async function postAiVisitorRespond(
  body: AiVisitorRespondRequest,
  widgetBearerToken?: string,
) {
  const base = getResolvedPublicApiBaseUrl();
  const res = await fetch(`${base}/ai/visitor/respond`, {
    method: "POST",
    credentials: WIDGET_FETCH_CREDENTIALS,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(widgetBearerToken
        ? { Authorization: `Bearer ${widgetBearerToken}` }
        : {}),
    },
    body: JSON.stringify(buildVisitorRespondJsonBody(body)),
  });

  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const maybe = await res.json();
      if (maybe?.message) msg = String(maybe.message);
    } catch {
      /* ignore */
    }
    return { ok: false as const, status: res.status, message: msg };
  }

  const raw = await res.json();
  const data = parseAiVisitorRespondResponse(raw);
  return { ok: true as const, data };
}

export type SubmitTextUsRequest = {
  widgetKey: string;
  websiteId: string;
  fieldValues: Record<string, unknown>;
  originHost?: string;
  serviceTileId?: string;
};

export type SubmitTextUsResponse = {
  submissionId: string;
  smsSent: boolean;
  smsMessageSid: string | null;
};

function parseTextUsSubmitResponse(raw: unknown): SubmitTextUsResponse | null {
  const peeled = peelSuccessEnvelope(raw);
  if (peeled === null || typeof peeled !== "object" || Array.isArray(peeled)) return null;
  const o = peeled as Record<string, unknown>;
  const submissionId = typeof o.submissionId === "string" ? o.submissionId : "";
  if (!submissionId) return null;
  return {
    submissionId,
    smsSent: o.smsSent === true,
    smsMessageSid: typeof o.smsMessageSid === "string" ? o.smsMessageSid : null,
  };
}

/** Public Text Us form submit — saves submission and sends SMS when website is configured. */
export async function postTextUsSubmit(body: SubmitTextUsRequest) {
  const payload: Record<string, unknown> = {
    widgetKey: body.widgetKey,
    websiteId: body.websiteId,
    fieldValues: body.fieldValues,
  };
  const originHost = body.originHost?.trim();
  if (originHost) payload.originHost = originHost;
  const serviceTileId = body.serviceTileId?.trim();
  if (serviceTileId) payload.serviceTileId = serviceTileId;

  const result = await fetchJsonPublic<unknown>(`/widget/text-us/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!result.ok) return result;
  const parsed = parseTextUsSubmitResponse(result.data);
  if (!parsed) {
    return {
      ok: false as const,
      status: 200,
      message: "Invalid Text Us submit response from server.",
    };
  }
  return { ok: true as const, data: parsed };
}
