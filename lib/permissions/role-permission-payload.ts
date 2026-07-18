import { isRecord } from "@/lib/utils/core/records";

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? (value as Record<string, unknown>) : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function unwrapData(payload: unknown): Record<string, unknown> | null {
  const root = asRecord(payload);
  if (!root) return null;
  const data = asRecord(root.data);
  return (data ?? root) as Record<string, unknown>;
}

function extractPermissionNamesByTypeField(
  payload: unknown,
  fieldName:
    | "permissionNamesByType"
    | "storedPermissionNamesByType"
    | "deniedPermissionNamesByType"
    | "effectivePermissionNamesByType",
): Record<string, unknown> | null {
  const source = unwrapData(payload);
  if (!source) return null;
  const raw = source[fieldName];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

export function flattenPermissionNamesByType(byType: Record<string, unknown> | null): string[] {
  if (!byType) return [];
  const out: string[] = [];
  for (const value of Object.values(byType)) {
    out.push(...asStringArray(value));
  }
  return Array.from(new Set(out)).sort();
}

export function splitPermissionNamesByType(byType: Record<string, unknown> | null): {
  operational: string[];
  page: string[];
} {
  if (!byType) return { operational: [], page: [] };
  const operational = asStringArray(byType.OPERATIONAL ?? byType.operational);
  const page = asStringArray(byType.PAGE ?? byType.page);
  return {
    operational: Array.from(new Set(operational)).sort(),
    page: Array.from(new Set(page)).sort(),
  };
}

function extractRolePermissionNamesLegacy(payload: unknown): string[] {
  const source = unwrapData(payload);
  if (!source) return [];
  const candidates = [
    source.permissionNames,
    source.permissions,
    source.assignedPermissionNames,
    source.assigned,
  ];
  for (const c of candidates) {
    const out = asStringArray(c);
    if (out.length > 0) return Array.from(new Set(out)).sort();
  }
  return [];
}

export function extractRoleExpandedPermissionNames(payload: unknown): string[] {
  const byType = extractPermissionNamesByTypeField(payload, "permissionNamesByType");
  if (byType) return flattenPermissionNamesByType(byType);
  return extractRolePermissionNamesLegacy(payload);
}

export function extractRoleExpandedByType(payload: unknown): {
  operational: string[];
  page: string[];
} {
  const byType = extractPermissionNamesByTypeField(payload, "permissionNamesByType");
  if (byType) return splitPermissionNamesByType(byType);
  const flat = extractRolePermissionNamesLegacy(payload);
  return {
    operational: flat.filter((code) => !code.startsWith("page:")),
    page: flat.filter((code) => code.startsWith("page:")),
  };
}

export function extractRoleStoredPermissionNames(payload: unknown): string[] {
  const storedByType = extractPermissionNamesByTypeField(
    payload,
    "storedPermissionNamesByType",
  );
  if (storedByType) return flattenPermissionNamesByType(storedByType);
  return extractRolePermissionNamesLegacy(payload);
}

export function extractRoleDeniedPermissionNames(payload: unknown): string[] {
  const deniedByType = extractPermissionNamesByTypeField(
    payload,
    "deniedPermissionNamesByType",
  );
  if (deniedByType) return flattenPermissionNamesByType(deniedByType);
  const source = unwrapData(payload);
  if (!source) return [];
  return Array.from(new Set(asStringArray(source.deniedPermissionNames))).sort();
}

export function extractRoleEffectiveByType(payload: unknown): {
  operational: string[];
  page: string[];
} {
  const effectiveByType = extractPermissionNamesByTypeField(
    payload,
    "effectivePermissionNamesByType",
  );
  if (effectiveByType) return splitPermissionNamesByType(effectiveByType);
  return extractRoleExpandedByType(payload);
}

export function extractImpliedPermissionNames(payload: unknown): string[] {
  const source = unwrapData(payload);
  if (!source) return [];
  return Array.from(new Set(asStringArray(source.impliedPermissionNames))).sort();
}

export function extractEquivalentPermissionNames(payload: unknown): string[] {
  const source = unwrapData(payload);
  if (!source) return [];
  return Array.from(new Set(asStringArray(source.equivalentPermissionNames))).sort();
}

export type PermissionExpandPreview = {
  operational: string[];
  page: string[];
  impliedPermissionNames: string[];
  equivalentPermissionNames: string[];
  deniedPermissionNames: string[];
  storedPermissionNames: string[];
};

/** Checkbox selection on load: stored ALLOW grants + effective runtime grants, minus DENY. */
export function buildSelectedPermissionSets(params: {
  stored: readonly string[];
  denied: readonly string[];
  effectiveOperational: readonly string[];
  effectivePage: readonly string[];
  equivalent?: readonly string[];
}): { operational: string[]; page: string[] } {
  const deniedSet = new Set(params.denied);
  const equivalentSet = new Set(params.equivalent ?? []);
  const selected = new Set<string>();

  for (const code of params.stored) {
    if (!deniedSet.has(code)) selected.add(code);
  }
  for (const code of [...params.effectiveOperational, ...params.effectivePage]) {
    if (!deniedSet.has(code) && !equivalentSet.has(code)) selected.add(code);
  }

  const operational: string[] = [];
  const page: string[] = [];
  for (const code of selected) {
    if (code.startsWith("page:")) page.push(code);
    else operational.push(code);
  }
  return {
    operational: operational.sort(),
    page: page.sort(),
  };
}

export function parsePermissionExpandPreview(payload: unknown): PermissionExpandPreview {
  const expanded = extractRoleEffectiveByType(payload);
  return {
    operational: expanded.operational,
    page: expanded.page,
    impliedPermissionNames: extractImpliedPermissionNames(payload),
    equivalentPermissionNames: extractEquivalentPermissionNames(payload),
    deniedPermissionNames: extractRoleDeniedPermissionNames(payload),
    storedPermissionNames: extractRoleStoredPermissionNames(payload),
  };
}
