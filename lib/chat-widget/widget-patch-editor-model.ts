import { isRecord } from "@/lib/utils";
import type { JsonRecord } from "@/api/types/common.types";
import type { WidgetAiTypeApi, WidgetChatModeApi, WidgetTypeApi } from "@/api/types/widgets.types";
import { mergeWidgetConfigForEdit } from "./merge-widget-config-for-edit";
import { applyAiTypeToWidgetConfig, parseAiTypeFromConfigRoot } from "./widget-ai-type";

export interface WidgetPatchEditorState {
  widgetType: WidgetTypeApi;
  embedAllowAnyOrigin: boolean;
  chatMode: WidgetChatModeApi;
  aiType: WidgetAiTypeApi;
  themeJson: string;
  uiJson: string;
  behaviorJson: string;
  sessionJson: string;
  formJson: string;
  responseJson: string;
  allowedDomainsText: string;
}

const CHAT_MODES: WidgetChatModeApi[] = ["AI_ONLY", "AGENT_ONLY", "HYBRID"];

function pretty(obj: unknown): string {
  if (obj === undefined || obj === null) return "{}";
  try {
    return JSON.stringify(
      typeof obj === "object" ? obj : {},
      null,
      2,
    );
  } catch {
    return "{}";
  }
}

function parseWidgetType(raw: unknown): WidgetTypeApi {
  const u = String(raw ?? "CHAT").toUpperCase();
  if (u === "TEXT_US") return "TEXT_US";
  if (u === "BOTH") return "BOTH";
  return "CHAT";
}

function parseChatMode(raw: unknown): WidgetChatModeApi {
  const u = String(raw ?? "HYBRID").toUpperCase();
  return CHAT_MODES.includes(u as WidgetChatModeApi)
    ? (u as WidgetChatModeApi)
    : "HYBRID";
}

/** Resolve snapshot payload for edit: draft config with published fill-in for missing keys. */
export function resolveSnapshotConfigRoot(snapshot: JsonRecord | null): JsonRecord {
  if (!snapshot || typeof snapshot !== "object") return {};

  const draftBlock = snapshot.draft;
  if (draftBlock && typeof draftBlock === "object" && !Array.isArray(draftBlock)) {
    const draftCfg = isRecord((draftBlock as JsonRecord).config)
      ? ((draftBlock as JsonRecord).config as JsonRecord)
      : null;
    const pubBlock = snapshot.published;
    const pubCfg =
      pubBlock &&
      typeof pubBlock === "object" &&
      !Array.isArray(pubBlock) &&
      isRecord((pubBlock as JsonRecord).config)
        ? ((pubBlock as JsonRecord).config as JsonRecord)
        : null;
    if (draftCfg) return mergeWidgetConfigForEdit(draftCfg, pubCfg);
  }

  const cs = snapshot.configSnapshot;
  if (cs !== undefined && cs !== null && typeof cs === "object" && !Array.isArray(cs)) {
    return cs as JsonRecord;
  }
  return snapshot;
}

export function editorStateFromApis(
  admin: JsonRecord | null,
  snapshot: JsonRecord | null,
): WidgetPatchEditorState {
  const embedRaw =
    admin?.embedAllowAnyOrigin ?? admin?.embed_allow_any_origin ?? false;
  const embedAllowAnyOrigin =
    embedRaw === true || embedRaw === "true" || embedRaw === 1;

  const root = resolveSnapshotConfigRoot(snapshot);

  const allowed = (() => {
    for (const raw of [
      snapshot?.allowedDomains,
      snapshot?.allowed_domains,
      admin?.allowedDomains,
      admin?.allowed_domains,
      root.allowedDomains,
      root.allowed_domains,
    ]) {
      if (!Array.isArray(raw)) continue;
      const list = raw.map((x) => String(x).trim()).filter(Boolean);
      if (list.length) return list;
    }
    return [] as string[];
  })();
  const allowedDomainsText = allowed.join("\n");

  let formSeed = root.form;
  const formShape = root.form as JsonRecord | undefined;
  const hasFormFields =
    formShape !== undefined &&
    typeof formShape === "object" &&
    Array.isArray(formShape.fields) &&
    formShape.fields.length > 0;
  const tuc = root.textUsFormConfig as JsonRecord | undefined;
  const hasLegacyFields =
    !hasFormFields &&
    typeof tuc === "object" &&
    Array.isArray(tuc.fields);
  if (hasLegacyFields) formSeed = { fields: tuc.fields };

  return {
    widgetType: parseWidgetType(admin?.widgetType ?? admin?.widget_type),
    embedAllowAnyOrigin,
    chatMode: parseChatMode(root.chatMode ?? root.chat_mode ?? root.mode),
    aiType: parseAiTypeFromConfigRoot(root),
    themeJson: pretty(root.theme),
    uiJson: pretty(root.ui),
    behaviorJson: pretty(root.behavior),
    sessionJson: pretty(root.session),
    formJson: pretty(formSeed),
    responseJson: pretty(root.response),
    allowedDomainsText,
  };
}

export function parseAllowedDomains(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseJsonSection(raw: string, label: string): JsonRecord | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    const v = JSON.parse(trimmed) as unknown;
    if (v === null || typeof v !== "object" || Array.isArray(v)) {
      return { error: `${label} must be a JSON object.` };
    }
    return v as JsonRecord;
  } catch {
    return { error: `Invalid JSON in ${label}.` };
  }
}

/** PATCH `/widgets/:widgetKey` body aligned with UpdateWidgetConfigurationDto. */
export function buildPatchWidgetBody(
  state: WidgetPatchEditorState,
  options?: { publishNow: boolean },
): JsonRecord | { error: string } {
  const theme = parseJsonSection(state.themeJson, "theme");
  const ui = parseJsonSection(state.uiJson, "ui");
  const behavior = parseJsonSection(state.behaviorJson, "behavior");
  const session = parseJsonSection(state.sessionJson, "session");
  const form = parseJsonSection(state.formJson, "form");
  const response = parseJsonSection(state.responseJson, "response");

  for (const x of [theme, ui, behavior, session, form, response]) {
    if ("error" in x) return x;
  }

  /** Whitelist forbids duplicating surfaces under `config.ui` (`chat`, `textUs`); use `theme.designJson` only. */
  if (typeof ui === "object" && ui !== null) {
    delete (ui as JsonRecord).chat;
    delete (ui as JsonRecord).textUs;
  }

  const config: JsonRecord = {
    theme,
    ui,
    behavior,
    session,
    form,
    response,
    allowedDomains: parseAllowedDomains(state.allowedDomainsText),
  };

  if (state.widgetType === "CHAT" || state.widgetType === "BOTH") {
    config.chatMode = state.chatMode;
    applyAiTypeToWidgetConfig(config, {
      chatMode: state.chatMode,
      aiType: state.aiType,
    });
  }

  delete config.textUsFormConfig;

  const body: JsonRecord = {
    widgetType: state.widgetType,
    publishNow: options?.publishNow ?? false,
    embedAllowAnyOrigin: state.embedAllowAnyOrigin,
    config,
  };

  return body;
}
