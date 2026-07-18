/** Widget-only JWT storage (sessionStorage). Never write to dashboard auth cookies. */
export const WIDGET_SESSION_KEY = "ic.widget.sessionToken.v1";
export const WIDGET_CONVERSATION_PREFIX = "ic.widget.conv.";

/** Short-lived JWT from POST /widget/session */
export function saveWidgetJwt(widgetKey: string, token: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(`${WIDGET_SESSION_KEY}.${widgetKey}`, token);
}

export function readWidgetJwt(widgetKey: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(`${WIDGET_SESSION_KEY}.${widgetKey}`);
}

export function clearWidgetJwt(widgetKey: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(`${WIDGET_SESSION_KEY}.${widgetKey}`);
}

export function persistVisitorSessionId(siteKey: string, sessionId: string) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(`ic.visitor.sessionId.${siteKey}`, sessionId);
}

export function readVisitorSessionId(siteKey: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(`ic.visitor.sessionId.${siteKey}`);
}

export function persistConversationId(siteKey: string, conversationId: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(`${WIDGET_CONVERSATION_PREFIX}${siteKey}`, conversationId);
}

export function readConversationId(siteKey: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(`${WIDGET_CONVERSATION_PREFIX}${siteKey}`);
}

export function clearConversationId(siteKey: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${WIDGET_CONVERSATION_PREFIX}${siteKey}`);
}

const HYBRID_ESCALATED_PREFIX = "ic.widget.hybridEscalated.";

/** HYBRID: visitor tapped “Talk to agent” — survives widget reload. */
export function persistHybridEscalated(siteKey: string, conversationId: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(
    `${HYBRID_ESCALATED_PREFIX}${siteKey}`,
    conversationId,
  );
}

export function readHybridEscalatedConversationId(siteKey: string): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(`${HYBRID_ESCALATED_PREFIX}${siteKey}`);
}

export function clearHybridEscalated(siteKey: string) {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(`${HYBRID_ESCALATED_PREFIX}${siteKey}`);
}

export function ensureVisitorSessionId(storageKey: string): string {
  const widgetKey = storageKey.includes(":") ? storageKey.split(":")[0]! : storageKey;
  for (const key of widgetKey === storageKey ? [storageKey] : [widgetKey, storageKey]) {
    const existing = readVisitorSessionId(key);
    if (existing) {
      persistVisitorSessionId(widgetKey, existing);
      if (storageKey !== widgetKey) {
        persistVisitorSessionId(storageKey, existing);
      }
      return existing;
    }
  }
  const created = generateClientSessionId();
  persistVisitorSessionId(widgetKey, created);
  if (storageKey !== widgetKey) {
    persistVisitorSessionId(storageKey, created);
  }
  return created;
}

export function generateClientSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto)
    return crypto.randomUUID();
  return `vs_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
