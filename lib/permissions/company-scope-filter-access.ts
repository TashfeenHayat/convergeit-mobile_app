import { PAGE, SCOPE_FILTER_READ } from "./permission-constants";
import { OP } from "./operational-keys";
import { canViewWebsiteAssignments } from "./website-assignment-access";

/** Org-scope filter picker APIs (`scope:filter:read` is granted to every user on the backend). */
export function canUseScopeFilterApis(
  hasOperational: (code: string) => boolean,
  rbacOff = false,
): boolean {
  return rbacOff || hasOperational(SCOPE_FILTER_READ);
}

/** Whether company/reseller scope filter pickers may load options. */
export function canAccessCompanyScopeFilters(
  _hasPage: (page: string) => boolean,
  hasOperational: (code: string) => boolean,
  rbacOff = false,
): boolean {
  return canUseScopeFilterApis(hasOperational, rbacOff);
}

/** Website directory list (`GET /companies/website-directory`). */
export function canViewWebsiteDirectory(
  hasPage: (page: string) => boolean,
  hasOperational: (code: string) => boolean,
): boolean {
  return (
    hasPage("page:clients") ||
    hasPage(PAGE.WEBSITE_DIRECTORY) ||
    canViewWebsiteAssignments(hasPage, hasOperational) ||
    hasOperational(OP.company.list) ||
    hasOperational(OP.company.view) ||
    hasOperational(OP.websiteAssignment.view)
  );
}
