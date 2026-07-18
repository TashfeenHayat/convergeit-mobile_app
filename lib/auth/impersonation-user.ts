import type { AuthApiUser } from "@/api/types/auth.types";
import type { User } from "./types";

function toDisplayName(user: {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  email?: string;
}): string {
  const first = user.firstName?.trim() ?? "";
  const middle = user.middleName?.trim() ?? "";
  const last = user.lastName?.trim() ?? "";
  const fullName = [first, middle, last].filter(Boolean).join(" ").trim();
  return fullName || (user.email?.trim() ?? "");
}

export type ImpersonationUserSnapshot = {
  id: string;
  email: string;
  displayName: string;
};

export function snapshotFromAuthApiUser(user: AuthApiUser): ImpersonationUserSnapshot | null {
  const id = user.id?.trim();
  const email = user.email?.trim();
  if (!id || !email) return null;
  return {
    id,
    email,
    displayName: toDisplayName(user) || email,
  };
}

export function userFromImpersonationSnapshot(
  snapshot: ImpersonationUserSnapshot | null | undefined,
): User | null {
  if (!snapshot?.id || !snapshot.email) return null;
  return {
    id: snapshot.id,
    email: snapshot.email,
    displayName: snapshot.displayName?.trim() || snapshot.email,
    role: "user",
  };
}
