/** Backend keys for permission buckets (see login /auth/me). */
export const PERMISSION_BUCKET_PAGE = "PAGE";
export const PERMISSION_BUCKET_OPERATIONAL = "OPERATIONAL";

/** Wildcard-style page permission some tenants send with the rest of PAGE perms. */
export const PAGE_ACCESS_ALL = "page:access";

/** Home shell `/dashboard` — granted on the client for everyone when RBAC is on; other `page:*` still come from the API. */
export const PAGE_PERMISSION_DASHBOARD = "page:dashboard";

export type PermissionsByType = Record<string, string[]>;

function normalizeBucketKey(rawKey: string): string {
  const key = rawKey.trim().toLowerCase().replace(/[\s_-]+/g, "");
  if (key === "page" || key === "pages" || key === "pagepermissions") return PERMISSION_BUCKET_PAGE;
  if (
    key === "operational" ||
    key === "operation" ||
    key === "operations" ||
    key === "operationalpermissions"
  ) {
    return PERMISSION_BUCKET_OPERATIONAL;
  }
  return rawKey.trim();
}

export function mergePermissionsByType(
  primary: PermissionsByType | undefined,
  secondary: PermissionsByType | undefined,
): PermissionsByType | undefined {
  if (!primary && !secondary) return undefined;
  const out: PermissionsByType = {};
  const keys = new Set([...Object.keys(primary ?? {}), ...Object.keys(secondary ?? {})]);
  for (const k of keys) {
    const merged = [...(primary?.[k] ?? []), ...(secondary?.[k] ?? [])];
    out[k] = [...new Set(merged)];
  }
  return applyPageSlugAliases(out);
}

function applyPageSlugAliases(perms: PermissionsByType): PermissionsByType {
  return perms;
}

/** Page keys for RBAC checks / sidebar filtering. */
export function toPermissionSet(perms: string[] | undefined): Set<string> {
  const raw = (perms ?? []).map((p) => p.trim()).filter(Boolean);
  return new Set(raw);
}

/**
 * When the API never sent `permissionsByType`, we skip UI RBAC so existing flows keep working.
 * When the object is present with at least one bucket key, we enforce checks (even if arrays are empty).
 */
export function isRbacActive(permissionsByType: PermissionsByType | undefined): boolean {
  return permissionsByType != null && Object.keys(permissionsByType).length > 0;
}

function normalizePermissionsRaw(raw: unknown): PermissionsByType | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: PermissionsByType = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(v)) continue;
    const normalizedKey = normalizeBucketKey(k);
    const normalizedValues = v.filter((x): x is string => typeof x === "string").map((s) => s.trim());
    out[normalizedKey] = [...(out[normalizedKey] ?? []), ...normalizedValues];
  }
  for (const key of Object.keys(out)) {
    out[key] = [...new Set(out[key])];
  }
  return Object.keys(out).length > 0 ? applyPageSlugAliases(out) : undefined;
}

/**
 * Login payloads may list stored role grants under `breakdown.fromRole` while the top-level
 * `page` / `operational` arrays only contain bundle-expanded runtime codes. Merge effective
 * grants (sources minus deny overrides) hydrate RBAC from role breakdown payloads.
 */
function normalizeRoleGrantBreakdown(bd: Record<string, unknown>): PermissionsByType | undefined {
  const grants = [
    ...readStringArray(bd.fromRole),
    ...readStringArray(bd.fromDepartment),
    ...readStringArray(bd.fromDesignation),
    ...readStringArray(bd.fromUserAllowOverride),
  ];
  if (grants.length === 0) return undefined;

  const denies = new Set([
    ...readStringArray(bd.fromRoleDenyOverride),
    ...readStringArray(bd.fromUserDenyOverride),
    ...readStringArray(bd.applicabilityFilteredOut),
  ]);

  const effective = [...new Set(grants.filter((code) => !denies.has(code)))];
  const operational = effective.filter((code) => !code.startsWith("page:"));
  const page = effective.filter((code) => code.startsWith("page:"));
  if (operational.length === 0 && page.length === 0) return undefined;

  return applyPageSlugAliases({
    [PERMISSION_BUCKET_OPERATIONAL]: operational,
    [PERMISSION_BUCKET_PAGE]: page,
  });
}

/**
 * Merges top-level `page` / `operational` arrays with `breakdown.{page,operational}`.
 * Some APIs send `page` only at the parent and duplicate (or extend) operational under
 * `breakdown`; returning `breakdown` alone used to drop `PAGE` and left RBAC with an empty
 * page set while `OPERATIONAL` still hydrated — sidebar saw zero `page:*` keys.
 */
function mergeBreakdownIntoPermissionBuckets(rec: Record<string, unknown>): PermissionsByType | undefined {
  const bd = rec.breakdown;
  const fromRoleGrants =
    bd && typeof bd === "object" && !Array.isArray(bd)
      ? normalizeRoleGrantBreakdown(bd as Record<string, unknown>)
      : undefined;
  const fromBreakdown =
    bd && typeof bd === "object" && !Array.isArray(bd)
      ? normalizePermissionsRaw(bd as Record<string, unknown>)
      : undefined;
  const fromSiblings = normalizePermissionsRaw(rec);
  return mergePermissionsByType(
    mergePermissionsByType(fromSiblings, fromBreakdown),
    fromRoleGrants,
  );
}

/**
 * `{ permissions: { breakdown: { page: [], operational: [] } } }` style payloads (also merges siblings).
 */
function normalizePermissionsBreakdown(raw: unknown): PermissionsByType | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return mergeBreakdownIntoPermissionBuckets(raw as Record<string, unknown>);
}

function readBooleanFlag(val: unknown): boolean {
  return val === true || val === "true" || val === 1;
}

function readExplicitBooleanFlag(val: unknown): boolean | undefined {
  if (readBooleanFlag(val)) return true;
  if (val === false || val === "false" || val === 0) return false;
  return undefined;
}

function extractExplicitIsPlatformAdminFromRecord(
  rec: Record<string, unknown>,
): boolean | undefined {
  const direct = readExplicitBooleanFlag(rec.isPlatformAdmin);
  if (direct !== undefined) return direct;

  const permSingular = rec.permission;
  if (permSingular && typeof permSingular === "object" && !Array.isArray(permSingular)) {
    const p = permSingular as Record<string, unknown>;
    const fromPerm = readExplicitBooleanFlag(p.isPlatformAdmin);
    if (fromPerm !== undefined) return fromPerm;
    const bd = p.breakdown;
    if (bd && typeof bd === "object" && !Array.isArray(bd)) {
      const fromBd = readExplicitBooleanFlag((bd as Record<string, unknown>).isPlatformAdmin);
      if (fromBd !== undefined) return fromBd;
    }
  }

  const perms = rec.permissions;
  if (perms && typeof perms === "object" && !Array.isArray(perms)) {
    const p = perms as Record<string, unknown>;
    const fromPerms = readExplicitBooleanFlag(p.isPlatformAdmin);
    if (fromPerms !== undefined) return fromPerms;
    const bd = p.breakdown;
    if (bd && typeof bd === "object" && !Array.isArray(bd)) {
      const fromBd = readExplicitBooleanFlag((bd as Record<string, unknown>).isPlatformAdmin);
      if (fromBd !== undefined) return fromBd;
    }
  }

  return undefined;
}

function extractExplicitIsPlatformAdmin(payload: unknown): boolean | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const root = payload as Record<string, unknown>;

  const fromRoot = extractExplicitIsPlatformAdminFromRecord(root);
  if (fromRoot !== undefined) return fromRoot;

  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const fromData = extractExplicitIsPlatformAdminFromRecord(data as Record<string, unknown>);
    if (fromData !== undefined) return fromData;
  }

  const user = root.user;
  if (user && typeof user === "object" && !Array.isArray(user)) {
    const fromUser = extractExplicitIsPlatformAdminFromRecord(user as Record<string, unknown>);
    if (fromUser !== undefined) return fromUser;
  }

  return undefined;
}

/** True when API marks the user as platform admin (full page + operational bypass in AuthContext). */
export function extractIsPlatformAdmin(payload: unknown): boolean {
  return resolveIsPlatformAdmin(payload);
}

/** Prefer explicit API flag; optional JWT role-name fallback only when API omits the flag. */
export function resolveIsPlatformAdmin(
  payload: unknown,
  jwtRoleFallback?: () => boolean,
): boolean {
  const explicit = extractExplicitIsPlatformAdmin(payload);
  if (explicit !== undefined) return explicit;
  return jwtRoleFallback?.() ?? false;
}

function readStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string").map((s) => s.trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Supports list-style payloads such as:
 * - [{ type: "PAGE", permissions: ["page:users"] }]
 * - [{ key: "PAGE", value: ["page:users"] }]
 */
function normalizePermissionsList(raw: unknown): PermissionsByType | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PermissionsByType = {};

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const rawKey = record.type ?? record.key ?? record.bucket ?? record.name;
    if (typeof rawKey !== "string" || !rawKey.trim()) continue;
    const normalizedKey = normalizeBucketKey(rawKey);
    const values = readStringArray(
      record.permissions ?? record.values ?? record.value ?? record.items,
    );
    if (values.length === 0) continue;
    out[normalizedKey] = [...(out[normalizedKey] ?? []), ...values];
  }

  for (const key of Object.keys(out)) {
    out[key] = [...new Set(out[key])];
  }
  return Object.keys(out).length > 0 ? applyPageSlugAliases(out) : undefined;
}

/** Shallow read for nested envelopes (e.g. login `context`, nested `user.context`). */
function extractPermissionsFromLooseRecord(record: Record<string, unknown>): PermissionsByType | undefined {
  const direct = normalizePermissionsRaw(record.permissionsByType);
  if (direct) return direct;

  /** Login envelope: `{ permission: { page: [], operational: [], breakdown?: {...} } }` */
  const permissionSingular = record.permission;
  if (permissionSingular && typeof permissionSingular === "object" && !Array.isArray(permissionSingular)) {
    const merged = mergeBreakdownIntoPermissionBuckets(permissionSingular as Record<string, unknown>);
    if (merged) return merged;
  }

  const permField = record.permissions;
  if (permField && typeof permField === "object" && !Array.isArray(permField)) {
    const merged = mergeBreakdownIntoPermissionBuckets(permField as Record<string, unknown>);
    if (merged) return merged;
  }

  const fromPermissionsList = normalizePermissionsList(record.permissions);
  if (fromPermissionsList) return fromPermissionsList;

  const topBreakdown = record.breakdown;
  if (topBreakdown && typeof topBreakdown === "object" && !Array.isArray(topBreakdown)) {
    const fromTop = normalizePermissionsBreakdown({ breakdown: topBreakdown });
    if (fromTop) return fromTop;
  }

  return undefined;
}

function extractFromRecord(record: Record<string, unknown>): PermissionsByType | undefined {
  const loose = extractPermissionsFromLooseRecord(record);
  if (loose) return loose;

  const context = record.context;
  if (context && typeof context === "object" && !Array.isArray(context)) {
    const fromContext = extractPermissionsFromLooseRecord(context as Record<string, unknown>);
    if (fromContext) return fromContext;
  }

  return undefined;
}

/** Supports flat or `{ data: { permissionsByType } }` envelopes from `/auth/me` or login. */
export function extractPermissionsByType(payload: unknown): PermissionsByType | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const root = payload as Record<string, unknown>;

  const rootPermissions = extractFromRecord(root);
  if (rootPermissions) return rootPermissions;

  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const dataRecord = data as Record<string, unknown>;
    const dataPermissions = extractFromRecord(dataRecord);
    if (dataPermissions) return dataPermissions;

    // Some APIs wrap twice: { data: { data: { permissionsByType } } }
    const nestedData = dataRecord.data;
    if (nestedData && typeof nestedData === "object" && !Array.isArray(nestedData)) {
      const nestedPermissions = extractFromRecord(nestedData as Record<string, unknown>);
      if (nestedPermissions) return nestedPermissions;
    }
  }

  // Fallback: permissions attached under user / role objects.
  const user = root.user;
  if (user && typeof user === "object" && !Array.isArray(user)) {
    const userRecord = user as Record<string, unknown>;
    const userPermissions = extractFromRecord(userRecord);
    if (userPermissions) return userPermissions;

    const userContext = userRecord.context;
    if (userContext && typeof userContext === "object" && !Array.isArray(userContext)) {
      const fromUserContext = extractPermissionsFromLooseRecord(userContext as Record<string, unknown>);
      if (fromUserContext) return fromUserContext;
    }

    const role = userRecord.role;
    if (role && typeof role === "object" && !Array.isArray(role)) {
      const rolePermissions = extractFromRecord(role as Record<string, unknown>);
      if (rolePermissions) return rolePermissions;
    }
  }

  return undefined;
}

export function hasPagePermission(pagePerms: Set<string>, required: string): boolean {
  if (required === PAGE_PERMISSION_DASHBOARD) return true;
  if (pagePerms.has(PAGE_ACCESS_ALL)) return true;
  return pagePerms.has(required);
}

/** Backend / legacy role payloads sometimes use alternate spellings for operational grants. */
const OPERATIONAL_PERMISSION_ALIASES: Record<string, string> = {
  "chat.access": "chat:bundle:agent",
  chat_access: "chat:bundle:agent",
  CHAT_ACCESS: "chat:bundle:agent",
  "chat-widget.view": "chat-widget:view",
  "chat-widget.update": "chat-widget:update",
};

export function hasOperationalPermission(opPerms: Set<string>, required: string): boolean {
  if (opPerms.has(required)) return true;
  for (const [alias, canonical] of Object.entries(OPERATIONAL_PERMISSION_ALIASES)) {
    if (canonical === required && opPerms.has(alias)) return true;
  }
  return false;
}
