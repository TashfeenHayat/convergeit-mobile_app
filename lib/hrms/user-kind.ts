export type UserKind = "Internal" | "External" | "—";

export function parseUserKind(raw: string | undefined | null): UserKind {
  const t = (raw ?? "").trim();
  if (t === "Internal" || t === "External") return t;
  return "—";
}

export function resolveUserKind(
  userTypeRaw: string | undefined | null,
  departmentTypeRaw?: string | undefined | null,
): UserKind {
  const userType = parseUserKind(userTypeRaw);
  if (userType !== "—") return userType;
  return parseUserKind(departmentTypeRaw);
}
