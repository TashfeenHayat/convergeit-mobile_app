import { useEffect, useMemo, useState } from "react";
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
} from "@/lib/companies/scope-tree-options";
import { canFetchWebsitesInOrgScope } from "@/features/chat-shared/utils/website-scope-options";
import { formatWebsiteSelectLabel } from "@/lib/websites/format-website-select-label";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function useSocialMediaWizardScope() {
  const { hasPage, hasOperational } = useAuth();
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();
  const canLoadScope =
    hasPage("page:social-media") || hasOperational("social-media:view");

  const [resellerId, setResellerId] = useState("");
  const [parentCompanyId, setParentCompanyId] = useState("");
  const [childCompanyId, setChildCompanyId] = useState("");
  const [websiteId, setWebsiteId] = useState("");

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId) {
      setResellerId(sessionResellerId);
    }
  }, [canFilterByResellerId, sessionResellerId]);

  const companiesTreeQuery = useScopedCompanyTreeQuery(
    resellerId,
    canFilterByResellerId,
    sessionResellerId,
    {
      enabled:
        canLoadScope &&
        (canFilterByResellerId ? resellerId.trim().length > 0 : true),
    },
  );

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: canLoadScope && canFilterByResellerId,
  });

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(
    buildWebsitesInScopeParams({
      canFilterByResellerId,
      all: true,
      resellerId,
      parentCompanyId,
      childCompanyId,
    }),
    {
      enabled:
        canLoadScope &&
        canFetchWebsitesInOrgScope({
          canFilterByResellerId,
          resellerId,
          parentCompanyId,
          childCompanyId,
        }),
      allowResellerIdFilter: canFilterByResellerId,
    },
  );

  const resellerOptions = useMemo(() => {
    return pickItemsArray(resellersQuery.data)
      .map((r) => toIdNameOption(r))
      .filter((o): o is { value: string; label: string } => o !== null);
  }, [resellersQuery.data]);

  const parentCompanyOptions = useMemo(() => {
    if (canFilterByResellerId && !resellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    return extractParentCompaniesFromByResellerTree(companiesTreeQuery.data);
  }, [canFilterByResellerId, companiesTreeQuery.data, resellerId]);

  const childCompanyOptions = useMemo(() => {
    if (!parentCompanyId.trim()) return [];
    return extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      parentCompanyId,
    );
  }, [companiesTreeQuery.data, parentCompanyId]);

  const websiteOptions = useMemo(() => {
    return pickItemsArray(websitesQuery.data)
      .map((row) => {
        const o = asRecord(row);
        if (!o) return null;
        const id = String(o.websiteId ?? o.id ?? "").trim();
        if (!id) return null;
        const name = String(o.websiteName ?? o.name ?? "").trim();
        const url = String(o.websiteUrl ?? o.url ?? "").trim();
        return {
          value: id,
          label: formatWebsiteSelectLabel(name, url, id),
        };
      })
      .filter((o): o is { value: string; label: string } => o !== null);
  }, [websitesQuery.data]);

  return {
    canFilterByResellerId,
    resellerId,
    setResellerId,
    parentCompanyId,
    setParentCompanyId,
    childCompanyId,
    setChildCompanyId,
    websiteId,
    setWebsiteId,
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
