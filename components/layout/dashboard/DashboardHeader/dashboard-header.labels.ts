type AuthUserLike = {
  roleLabel?: string;
  role?: string | { name?: string } | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  displayName?: string;
} | null;

export function dashboardDisplayName(user: AuthUserLike): string {
  if (!user) return "User";
  if (user.displayName?.trim()) return user.displayName.trim();
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fromParts) return fromParts;
  if (user.email?.trim()) return user.email.trim();
  return "User";
}

export function dashboardRoleLabel(user: AuthUserLike): string {
  if (!user) return "User";
  if (user.roleLabel) return user.roleLabel;
  const roleName =
    typeof user.role === "string" ? user.role : user.role?.name?.toLowerCase?.() ?? "";
  if (roleName === "admin") return "Admin";
  if (roleName === "hr-admin") return "HR Admin";
  if (roleName === "network-admin") return "Network Admin";
  if (roleName === "manager") return "Manager";
  if (typeof user.role === "object" && user.role?.name) return user.role.name;
  return "User";
}

export function dashboardUserInitials(displayName: string): string {
  return displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function dashboardFirstWord(displayName: string): string {
  return displayName.split(" ")[0] ?? displayName;
}
