import type { User } from "@/lib/auth/types";
import { mayPassResellerIdListFilter } from "@/lib/companies/reseller-list-filter";

export type AiTrainingListScope = {
  resellerId?: string;
  parentCompanyId?: string;
  childCompanyId?: string;
};

/** Default API filters from JWT session — backend enforces the same rules. */
export function buildAiTrainingSessionScope(
  user: User | null | undefined,
): AiTrainingListScope {
  if (!user) return {};

  const resellerId = user.resellerId?.trim();
  const parentCompanyId = user.parentCompanyId?.trim();

  if (mayPassResellerIdListFilter(user)) {
    return {};
  }

  if (user.wideResellerScope && resellerId) {
    return { resellerId };
  }

  if (parentCompanyId && resellerId) {
    return { resellerId, parentCompanyId };
  }

  if (resellerId) {
    return { resellerId };
  }

  return parentCompanyId ? { parentCompanyId } : {};
}
