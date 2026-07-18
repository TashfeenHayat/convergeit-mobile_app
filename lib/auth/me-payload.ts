import type { User } from "./types";
import {
  extractPermissionsByType,
  PERMISSION_BUCKET_OPERATIONAL,
  PERMISSION_BUCKET_PAGE,
} from "./permissions-model";

type MeClaims = {
  licenseKey?: string;
  roles?: string[];
};

function readClaimsRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const direct = root.claims;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = (data as Record<string, unknown>).claims;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return null;
}

/** Reads `claims` from `/auth/me` (`data.claims` or top-level `claims`). */
export function extractClaimsFromMePayload(payload: unknown): MeClaims {
  const claims = readClaimsRecord(payload);
  if (!claims) return {};

  const licenseKey =
    typeof claims.licenseKey === "string" && claims.licenseKey.trim()
      ? claims.licenseKey.trim()
      : undefined;

  const rolesRaw = claims.roles;
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw
        .filter((role): role is string => typeof role === "string")
        .map((role) => role.trim())
        .filter(Boolean)
    : undefined;

  return { licenseKey, roles };
}

/** Merges `/auth/me` claims (license key, role label) into the mapped user profile. */
export function enrichUserFromMePayload(mapped: User | null, payload: unknown): User | null {
  if (!mapped) return null;

  const { licenseKey, roles } = extractClaimsFromMePayload(payload);
  const roleFromClaims = roles?.[0];

  return {
    ...mapped,
    licenseKey: licenseKey ?? mapped.licenseKey,
    roleLabel: mapped.roleLabel?.trim() || roleFromClaims || mapped.roleLabel,
  };
}

export type MeProfileView = {
  displayName: string;
  email: string;
  roleLabel: string;
  licenseKey: string;
  userId: string;
  userType: string;
  department: string;
  designation: string;
  theme: string;
  operationalPermissions: string[];
  pagePermissions: string[];
};

function readNestedName(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "—";
  const name = (value as { name?: unknown }).name;
  if (name == null || String(name).trim() === "") return "—";
  return String(name).trim();
}

function readThemeLabel(user: Record<string, unknown>): string {
  const theme = user.theme;
  if (!theme || typeof theme !== "object" || Array.isArray(theme)) return "—";
  const themeRecord = theme as { backgroundColor?: unknown; themeJson?: unknown };
  const backgroundColor =
    themeRecord.backgroundColor != null && String(themeRecord.backgroundColor).trim()
      ? String(themeRecord.backgroundColor).trim()
      : "";
  const themeJson =
    themeRecord.themeJson != null && String(themeRecord.themeJson).trim()
      ? String(themeRecord.themeJson).trim()
      : "";
  if (backgroundColor && themeJson) return `${backgroundColor} · ${themeJson}`;
  if (backgroundColor) return backgroundColor;
  if (themeJson) return themeJson;
  return "—";
}

function extractMeUserRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const direct = root.user;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return direct as Record<string, unknown>;
  }
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = (data as Record<string, unknown>).user;
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return null;
}

/** Profile fields for settings UI from GET `/auth/me`. */
export function extractProfileFromMePayload(payload: unknown): MeProfileView | null {
  const user = extractMeUserRecord(payload);
  if (!user) return null;

  const first = String(user.firstName ?? "").trim();
  const middle = String(user.middleName ?? "").trim();
  const last = String(user.lastName ?? "").trim();
  const email = String(user.email ?? "").trim();
  const userId = String(user.id ?? "").trim();
  const displayName = [first, middle, last].filter(Boolean).join(" ").trim() || email;

  const roleObj = user.role;
  const roleFromUser =
    roleObj &&
    typeof roleObj === "object" &&
    !Array.isArray(roleObj) &&
    typeof (roleObj as { name?: string }).name === "string"
      ? (roleObj as { name: string }).name.trim()
      : "";

  const { licenseKey, roles } = extractClaimsFromMePayload(payload);
  const roleLabel = roleFromUser || roles?.[0] || "—";
  const userTypeRaw = user.userType ?? user.user_type;
  const userType =
    userTypeRaw != null && String(userTypeRaw).trim() ? String(userTypeRaw).trim() : "—";

  const permissions = extractPermissionsByType(payload);
  const operationalPermissions = [...(permissions?.[PERMISSION_BUCKET_OPERATIONAL] ?? [])].sort();
  const pagePermissions = [...(permissions?.[PERMISSION_BUCKET_PAGE] ?? [])].sort();

  return {
    displayName: displayName || "—",
    email: email || "—",
    roleLabel,
    licenseKey: licenseKey ?? "—",
    userId: userId || "—",
    userType,
    department: readNestedName(user.department),
    designation: readNestedName(user.designation),
    theme: readThemeLabel(user),
    operationalPermissions,
    pagePermissions,
  };
}
