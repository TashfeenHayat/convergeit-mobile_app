import { CHAT_BUNDLE_OPTIONS } from "./chat-bundles";

/**
 * Operational codes that gate agent inbox APIs/socket (replaces retired `chat:access`).
 * Backend stores bundles on roles; `/auth/me` may return bundle codes without expanding them.
 */
export const CHAT_INBOX_BUNDLE_CODES = CHAT_BUNDLE_OPTIONS.filter((b) =>
  ["chat:bundle:agent", "chat:bundle:pool-head", "chat:bundle:internal-supervisor"].includes(b.code),
).map((b) => b.code);

/** Granular chat ops that imply live inbox when `page:chat-inbox` is granted. */
export const CHAT_INBOX_GRANULAR_OPS = [
  "chat:guest-link:send",
  "chat:update-visitor-profile",
] as const;

export const CHAT_INBOX_OPERATIONAL_ANY = [
  ...CHAT_INBOX_BUNDLE_CODES,
  ...CHAT_INBOX_GRANULAR_OPS,
] as const;

export function hasChatInboxOperational(codes: readonly string[]): boolean {
  return CHAT_INBOX_OPERATIONAL_ANY.some((code) => codes.includes(code));
}

export function hasChatInboxOperationalFromChecker(
  hasOperational: (permission: string) => boolean,
): boolean {
  return CHAT_INBOX_OPERATIONAL_ANY.some((code) => hasOperational(code));
}
