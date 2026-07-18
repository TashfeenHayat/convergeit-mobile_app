import { isRecord, unwrapApiData } from '@/lib/utils/core';

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[])
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0);
}

function flattenPermissionNamesByType(v: unknown): string[] {
  if (!isRecord(v)) return [];
  const out: string[] = [];
  for (const value of Object.values(v)) {
    out.push(...asStringArray(value));
  }
  return out;
}

/** Normalize `GET /users/:id/permissions` into direct + effective override lists. */
export function extractUserPermissionOverrides(payload: unknown): {
  directAllowed: string[];
  directDenied: string[];
  effectiveAllowed: string[];
} {
  const data = unwrapApiData(payload);
  const obj = isRecord(data) ? data : null;
  const effectiveAllowedByType = flattenPermissionNamesByType(
    obj?.effectiveAllowedPermissionNamesByType,
  );
  const directAllowedByType = flattenPermissionNamesByType(
    obj?.directAllowedPermissionNamesByType,
  );
  const directDeniedByType = flattenPermissionNamesByType(
    obj?.directDeniedPermissionNamesByType,
  );
  const legacyAllowedByType = flattenPermissionNamesByType(
    obj?.allowedPermissionNamesByType,
  );
  const legacyDeniedByType = flattenPermissionNamesByType(obj?.deniedPermissionNamesByType);
  const permissionNames =
    asStringArray(obj?.permissionNames) ||
    asStringArray(obj?.permissions) ||
    asStringArray(obj?.effectivePermissionNames);
  const allowed =
    asStringArray(obj?.allowedPermissionNames) ||
    asStringArray(obj?.allowedPermissions) ||
    asStringArray(obj?.allowed);
  const denied =
    asStringArray(obj?.deniedPermissionNames) ||
    asStringArray(obj?.deniedPermissions) ||
    asStringArray(obj?.denied);

  return {
    directAllowed: Array.from(
      new Set((directAllowedByType.length > 0 ? directAllowedByType : allowed).filter(Boolean)),
    ).sort(),
    directDenied: Array.from(
      new Set(
        (directDeniedByType.length > 0
          ? directDeniedByType
          : [...legacyDeniedByType, ...denied]
        ).filter(Boolean),
      ),
    ).sort(),
    effectiveAllowed: Array.from(
      new Set(
        [
          ...(effectiveAllowedByType.length > 0 ? effectiveAllowedByType : legacyAllowedByType),
          ...permissionNames,
        ].filter(Boolean),
      ),
    ).sort(),
  };
}
