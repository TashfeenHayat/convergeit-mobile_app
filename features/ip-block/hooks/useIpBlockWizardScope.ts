import { useEffect, useMemo } from "react";
import { useAuth, useResellerListScope } from "@/lib/auth";
import {
  buildWebsitesInScopeParams,
  useCompaniesSetupResellersQuery,
  useScopedCompanyTreeQuery,
  useWebsiteAssignmentsWebsitesQuery,
} from "@/lib/hooks";
import {
  extractChildCompanyOptionsForParentFromByResellerTree,
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from "@/app/dashboard/user-page/components/add-user-modal.utils";
import { canFetchWebsitesInOrgScope } from "@/features/chat-shared/utils/website-scope-options";
import { formatWebsiteSelectLabel } from "@/lib/websites/format-website-select-label";
import type { IpBlockWizardDraft } from "../wizard-storage";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function useIpBlockWizardScope(
  draft: IpBlockWizardDraft,
  patchDraft: (patch: Partial<IpBlockWizardDraft>) => void,
) {
  const { hasPage, hasOperational } = useAuth();
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();
  const canLoadScope =
    hasPage("page:ip-blocklist") || hasOperational("ip-blocklist:view");

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId) {
      patchDraft({ resellerId: sessionResellerId });
    }
  }, [canFilterByResellerId, sessionResellerId, patchDraft]);

  const companiesTreeQuery = useScopedCompanyTreeQuery(
    draft.resellerId,
    canFilterByResellerId,
    sessionResellerId,
    {
      enabled:
        canLoadScope &&
        (canFilterByResellerId ? draft.resellerId.trim().length > 0 : true),
    },
  );

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: canLoadScope && canFilterByResellerId,
  });

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(
    buildWebsitesInScopeParams({
      canFilterByResellerId,
      all: true,
      resellerId: draft.resellerId,
      parentCompanyId: draft.parentCompanyId,
      childCompanyId: "",
    }),
    {
      enabled:
        canLoadScope &&
        canFetchWebsitesInOrgScope({
          canFilterByResellerId,
          resellerId: draft.resellerId,
          parentCompanyId: draft.parentCompanyId,
          childCompanyId: "",
        }),
      allowResellerIdFilter: canFilterByResellerId,
    },
  );

  const resellerOptions = useMemo(() => {
    const rows = pickItemsArray(resellersQuery.data)
      .map((r) => toIdNameOption(r))
      .filter((o): o is { value: string; label: string } => o !== null);
    return rows;
  }, [resellersQuery.data]);

  const parentCompanyOptions = useMemo(() => {
    if (canFilterByResellerId && !draft.resellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    return extractParentCompaniesFromByResellerTree(companiesTreeQuery.data);
  }, [canFilterByResellerId, companiesTreeQuery.data, draft.resellerId]);

  const childCompanyOptions = useMemo(() => {
    if (!draft.parentCompanyId.trim()) {
      return [];
    }
    return extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      draft.parentCompanyId,
    );
  }, [companiesTreeQuery.data, draft.parentCompanyId]);

  const websiteOptions = useMemo(() => {
    const items = pickItemsArray(websitesQuery.data);
    const childFilter =
      draft.childCompanyIds.length > 0
        ? new Set(draft.childCompanyIds)
        : null;

    return items
      .map((row) => {
        const o = asRecord(row);
        if (!o) return null;
        const id = String(o.websiteId ?? o.id ?? "").trim();
        if (!id) return null;
        const childId = String(o.childCompanyId ?? "").trim();
        if (childFilter && childId && !childFilter.has(childId)) return null;
        const name = String(o.websiteName ?? o.name ?? "").trim();
        const url = String(o.websiteUrl ?? o.url ?? "").trim();
        return {
          value: id,
          label: formatWebsiteSelectLabel(name, url, id),
        };
      })
      .filter((o): o is { value: string; label: string } => o !== null);
  }, [draft.childCompanyIds, websitesQuery.data]);

  return {
    canFilterByResellerId,
    resellerOptions,
    parentCompanyOptions,
    childCompanyOptions,
    websiteOptions,
    loading:
      companiesTreeQuery.isLoading ||
      resellersQuery.isLoading ||
      websitesQuery.isLoading,
  };
}
