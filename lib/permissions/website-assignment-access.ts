import { PAGE } from "./permission-constants";
import { canPermissionCode, type AuthPermissionArrays } from "./access-helpers";
import { OP } from "./operational-keys";

export function canViewWebsiteAssignmentsFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    canPermissionCode(PAGE.WEBSITE_ASSIGNMENTS, perms) &&
    (canPermissionCode(OP.websiteAssignment.view, perms) ||
      canPermissionCode(OP.website.assign, perms))
  );
}

export function canAssignWebsiteFromArrays(perms: AuthPermissionArrays): boolean {
  return (
    canPermissionCode(PAGE.WEBSITE_ASSIGNMENTS, perms) &&
    canPermissionCode(OP.website.assign, perms)
  );
}

export function canViewWebsiteAssignments(
  hasPage: (page: string) => boolean,
  hasOperational: (code: string) => boolean,
): boolean {
  return (
    hasPage(PAGE.WEBSITE_ASSIGNMENTS) &&
    (hasOperational(OP.websiteAssignment.view) || hasOperational(OP.website.assign))
  );
}

export function canAssignWebsite(
  hasPage: (page: string) => boolean,
  hasOperational: (code: string) => boolean,
): boolean {
  return hasPage(PAGE.WEBSITE_ASSIGNMENTS) && hasOperational(OP.website.assign);
}
