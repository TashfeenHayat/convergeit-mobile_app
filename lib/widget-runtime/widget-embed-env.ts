/** Where the embed runs — controls analytics suppression (dashboard preview only). */
export type WidgetEmbedEnv = "production" | "staging" | "dashboard_preview";

export function resolveWidgetEmbedEnv(params: {
  env?: string | null;
  sandbox?: string | null;
  trainingTest?: string | null;
}): WidgetEmbedEnv {
  const raw = params.env?.trim().toLowerCase();
  if (raw === "staging" || raw === "test") return "staging";
  if (raw === "preview" || raw === "dashboard_preview" || raw === "dashboard-preview") {
    return "dashboard_preview";
  }
  const sandbox =
    params.sandbox === "1" ||
    params.sandbox === "true" ||
    params.trainingTest === "1";
  if (sandbox) return "dashboard_preview";
  return "production";
}

/** Client staging/dev sites count visits, opens, chats, and leads like production. */
export function shouldSkipWidgetAnalytics(env: WidgetEmbedEnv): boolean {
  return env === "dashboard_preview";
}

/** Only dashboard iframe preview skips backend analytics / lead side-effects. */
export function shouldSendSandboxConversationFlag(env: WidgetEmbedEnv): boolean {
  return env === "dashboard_preview";
}

export function widgetEmbedEnvQueryValue(env: WidgetEmbedEnv): string | null {
  if (env === "staging") return "staging";
  if (env === "dashboard_preview") return "preview";
  return null;
}
