import type { WidgetExperienceV1 } from "./widget-experience";

export type WidgetTypeDto = "CHAT" | "TEXT_US" | "BOTH" | string;

export type WidgetModeDto = "AI_ONLY" | "AGENT_ONLY" | "HYBRID" | string;

export interface WidgetSurfacesDto {
  chatEnabled?: boolean;
  textUsEnabled?: boolean;
}

export interface WidgetFeatureFlagsDto {
  chat?: boolean;
  textUs?: boolean;
}

/** Public `/widget/config/:key` response — `config` may be absent until publish or on older payloads. */
export interface WidgetConfigEnvelope {
  widgetKey: string;
  websiteId: string;
  widgetType: WidgetTypeDto;
  surfaces: WidgetSurfacesDto;
  featureFlags: WidgetFeatureFlagsDto;
  embedAllowAnyOrigin?: boolean;
  status: string;
  allowedDomains?: string[];
  /** Chat mode sometimes appears at envelope root (`chatMode`) instead of `config.mode`. */
  chatMode?: WidgetModeDto;
  /** Compiled v1 document from publish snapshot (preferred for embed). */
  experience?: WidgetExperienceV1;
  /** Three-origin hints from API env (app / api / optional CDN loader). */
  embed?: {
    appOrigin?: string | null;
    apiOrigin?: string | null;
    scriptSrc?: string | null;
    cdnOrigin?: string | null;
  };
  /** Flattened legacy embed settings (older API payloads only). */
  clientSettings?: Record<string, unknown>;
  /** Published theme editor snapshot for embed colors/layout (same as `clientSettings.theme.designJson`). */
  themeDesignJson?: Record<string, unknown>;
  /** Text-us field definitions when not folded into legacy `config`. */
  textUsFormConfig?: Record<string, unknown>;
  config?: {
    mode?: WidgetModeDto;
    welcomeMessage?: string;
    settingsJson?: Record<string, unknown>;
    theme?: Record<string, unknown>;
    serviceTiles?: unknown[];
    textUsFormConfig?: Record<string, unknown>;
    form?: Record<string, unknown>;
    behavior?: {
      inquiryOptions?: import("@/lib/chat-widget/widget-inquiry.types").WidgetInquiryOption[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export interface WidgetSessionRequest {
  widgetKey: string;
  /** Optional — server may infer from Origin/Referer when omitted. */
  originHost?: string;
  /** Public draft sandbox — signed token from preview-share-link. */
  previewShareToken?: string;
}

export interface WidgetSessionResponse {
  tokenType: string;
  sessionToken: string;
  expiresIn: string;
  widgetKey: string;
  websiteId: string;
  widgetType: string;
  surfaces: WidgetSurfacesDto;
}

export interface AiVisitorRespondRequest {
  message: string;
  /** KB scope + conversation resolution — omit when empty so backend can resolve from conversationId. */
  websiteId?: string;
  conversationId?: string;
  widgetKey: string;
  originHost: string;
  /**
   * Full page URL where the widget is embedded. When backend enables live-page context, this grounds the model.
   * Same semantics as widget message APIs’ `currentPageUrl`.
   */
  currentPageUrl?: string;
}

export interface AiVisitorRespondResponse {
  intent?: string;
  shouldEscalate?: boolean;
  response: string;
  knowledgeMatches?: Array<{
    sourceId: string;
    sourceRef?: string;
    score?: number;
    snippet?: string;
    content?: string;
  }>;
  topKnowledgeMatch?: {
    chunkPreview?: string;
  } | null;
}
