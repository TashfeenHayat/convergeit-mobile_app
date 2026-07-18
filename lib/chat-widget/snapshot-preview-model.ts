import type { JsonRecord } from "@/api/types/common.types";

export type SnapshotPreviewKind = "CHAT" | "TEXT_US" | "BOTH" | "unknown";

export interface ParsedSnapshotPreview {
  kind: SnapshotPreviewKind;
  widgetTypeLabel: string;
  /** Raw chat block from `theme.designJson.chat`. */
  chat?: JsonRecord;
  /** Raw text-us block from `theme.designJson.textUs`. */
  textUs?: JsonRecord;
  /** Config row mode when present (e.g. AI_ONLY). */
  mode?: string;
  hasRenderable: boolean;
}

function configRootFromSnapshot(snapshot: JsonRecord): JsonRecord | undefined {
  const draft = snapshot.draft as JsonRecord | undefined;
  if (draft?.config && typeof draft.config === "object") {
    return draft.config as JsonRecord;
  }
  const cs = snapshot.configSnapshot;
  if (cs && typeof cs === "object" && !Array.isArray(cs)) {
    return cs as JsonRecord;
  }
  return undefined;
}

function designJsonFromSnapshot(snapshot: JsonRecord): JsonRecord | null {
  const cfg = configRootFromSnapshot(snapshot);
  const theme = cfg?.theme as JsonRecord | undefined;
  const fromCfg = theme?.designJson as JsonRecord | undefined;
  if (fromCfg && typeof fromCfg === "object") return fromCfg;

  const cs = snapshot.configSnapshot as JsonRecord | undefined;
  const t2 = cs?.theme as JsonRecord | undefined;
  const dj2 = t2?.designJson as JsonRecord | undefined;
  if (dj2 && typeof dj2 === "object") return dj2;

  const flat = cs as JsonRecord | undefined;
  if (flat?.designJson && typeof flat.designJson === "object") {
    return flat.designJson as JsonRecord;
  }
  return null;
}

export function parseSnapshotForPreview(snapshot: JsonRecord | null): ParsedSnapshotPreview | null {
  if (!snapshot || typeof snapshot !== "object") return null;

  const wtRaw = String(snapshot.widgetType ?? "").toUpperCase();
  let kind: SnapshotPreviewKind = "unknown";
  if (wtRaw === "CHAT") kind = "CHAT";
  else if (wtRaw === "TEXT_US") kind = "TEXT_US";
  else if (wtRaw === "BOTH") kind = "BOTH";

  const dj = designJsonFromSnapshot(snapshot);
  const chat =
    dj?.chat !== undefined && typeof dj.chat === "object" && !Array.isArray(dj.chat)
      ? (dj.chat as JsonRecord)
      : undefined;
  const textUs =
    dj?.textUs !== undefined && typeof dj.textUs === "object" && !Array.isArray(dj.textUs)
      ? (dj.textUs as JsonRecord)
      : undefined;

  const cfg = configRootFromSnapshot(snapshot);
  const mode = typeof cfg?.mode === "string" ? cfg.mode : undefined;

  const hasRenderable =
    Boolean(chat && Object.keys(chat).length > 0) ||
    Boolean(textUs && Object.keys(textUs).length > 0);

  return {
    kind,
    widgetTypeLabel: wtRaw || "—",
    chat,
    textUs,
    mode,
    hasRenderable,
  };
}
