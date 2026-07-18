import { asRecord } from '@/lib/users/user-list-rows';

function firstArrayObject(value: unknown): Record<string, unknown> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return asRecord(value[0]);
}

function looksLikeUserRecord(row: Record<string, unknown> | null): boolean {
  if (!row) return false;
  return (
    row.email != null ||
    row.firstName != null ||
    row.first_name != null ||
    row.id != null ||
    row.phoneNo != null ||
    row.phone != null
  );
}

/** Normalize `GET /users/:id` (and similar) envelopes to a flat user object. */
export function extractUserRecordFromDetailPayload(
  payload: unknown,
): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  const payloadObj = asRecord(root.payload);
  const nestedUser =
    asRecord(root.user) ||
    asRecord(data?.user) ||
    asRecord(root.item) ||
    asRecord(data?.item) ||
    asRecord(data?.record) ||
    asRecord(payloadObj?.user) ||
    firstArrayObject(root.data) ||
    firstArrayObject(data?.items) ||
    firstArrayObject(data?.rows) ||
    firstArrayObject(data?.results) ||
    firstArrayObject(data?.users);

  if (looksLikeUserRecord(nestedUser)) return nestedUser;
  if (looksLikeUserRecord(data)) return data;
  if (looksLikeUserRecord(root)) return root;
  return null;
}
