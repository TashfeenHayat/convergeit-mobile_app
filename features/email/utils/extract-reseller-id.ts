function readId(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

/** Reads reseller scope from `/auth/me` envelopes (`context`, `actor`, nested `data`). */
export function extractResellerIdFromMePayload(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const root = payload as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const context =
    (data.context && typeof data.context === "object"
      ? (data.context as Record<string, unknown>)
      : null) ??
    (root.context && typeof root.context === "object" ? (root.context as Record<string, unknown>) : null);

  const actor =
    (data.actor && typeof data.actor === "object"
      ? (data.actor as Record<string, unknown>)
      : null) ??
    (context?.actor && typeof context.actor === "object"
      ? (context.actor as Record<string, unknown>)
      : null);

  return (
    readId(actor?.resellerId) ??
    readId(actor?.reseller_id) ??
    readId(context?.resellerId) ??
    readId(context?.reseller_id) ??
    readId(data.resellerId) ??
    readId(data.reseller_id)
  );
}
