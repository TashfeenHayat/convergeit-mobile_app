/** Shared HTTP helpers for chat REST clients. */

export function unwrapChatHttpData<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as { success?: unknown }).success === true &&
    "data" in payload &&
    (payload as { data: unknown }).data !== undefined
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function chatAuthHeaders(token?: string): Record<string, string> | undefined {
  if (!token?.trim()) return undefined;
  return { Authorization: `Bearer ${token.trim()}` };
}
