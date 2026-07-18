/** Unwraps `{ success, data }` and common nested list/detail shapes from axios `response.data`. */
export function unwrapApiData<T>(payload: unknown): T {
  if (payload == null) {
    return payload as T;
  }

  const root = payload as Record<string, unknown>;

  if (typeof root.success === "boolean" && "data" in root) {
    return unwrapApiData<T>(root.data);
  }

  return payload as T;
}
