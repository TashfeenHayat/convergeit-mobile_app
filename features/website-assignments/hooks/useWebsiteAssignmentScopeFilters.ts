import { useEffect, useMemo, useState } from "react";
import { useAuth, useResellerListScope } from "@/lib/auth";
import { canAccessCompanyScopeFilters } from "@/lib/permissions";
import {
  useCompaniesSetupResellersQuery,
  useScopedCompanyTreeQuery,
} from "@/lib/hooks";
import {
  extractChildCompanyOptionsForParentFromByResellerTree,
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from "@/lib/companies/scope-tree-options";

export type WebsiteAssignmentScopeFilterState = {
  filterResellerId: string;
  filterParentCompanyId: string;
  filterChildCompanyId: string;
  setFilterResellerId: (v: string) => void;
  setFilterParentCompanyId: (v: string) => void;
  setFilterChildCompanyId: (v: string) => void;
  resellerFilterOptions: { value: string; label: string }[];
  parentCompanyFilterOptions: { value: string; label: string }[];
  childCompanyFilterOptions: { value: string; label: string }[];
  canFilterByResellerId: boolean;
  hasScopeFilters: boolean;
  clearScopeFilters: () => void;
};

export function useWebsiteAssignmentScopeFilters(): WebsiteAssignmentScopeFilterState {
  const { hasPage, hasOperational, rbacEnabled } = useAuth();
  const canLoadScopeFilters = canAccessCompanyScopeFilters(
    hasPage,
    hasOperational,
    !rbacEnabled,
  );
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();
  const [filterResellerId, setFilterResellerId] = useState("");
  const [filterParentCompanyId, setFilterParentCompanyId] = useState("");
  const [filterChildCompanyId, setFilterChildCompanyId] = useState("");

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId) {
      setFilterResellerId(sessionResellerId);
    }
  }, [canFilterByResellerId, sessionResellerId]);

  useEffect(() => {
    setFilterParentCompanyId("");
    setFilterChildCompanyId("");
  }, [filterResellerId]);

  useEffect(() => {
    setFilterChildCompanyId("");
  }, [filterParentCompanyId]);

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: canLoadScopeFilters && canFilterByResellerId,
  });
  const companiesTreeQuery = useScopedCompanyTreeQuery(
    filterResellerId,
    canFilterByResellerId,
    sessionResellerId,
    {
      enabled:
        canLoadScopeFilters &&
        (canFilterByResellerId ? filterResellerId.trim().length > 0 : true),
    },
  );

  const resellerFilterOptions = useMemo(() => {
    const opts = pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    if (opts.length > 0) return [{ value: "", label: "All resellers" }, ...opts];
    return [
      { value: "", label: resellersQuery.isLoading ? "Loading resellers…" : "No resellers available" },
    ];
  }, [resellersQuery.data, resellersQuery.isLoading]);

  const parentCompanyFilterOptions = useMemo(() => {
    if (canFilterByResellerId && !filterResellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(companiesTreeQuery.data).map((o) => ({
      value: o.value,
      label: o.label,
    }));
    if (extracted.length > 0) {
      return [{ value: "", label: "All parent companies" }, ...extracted];
    }
    return [
      {
        value: "",
        label: companiesTreeQuery.isLoading ? "Loading parent companies…" : "No parent companies",
      },
    ];
  }, [canFilterByResellerId, filterResellerId, companiesTreeQuery.data, companiesTreeQuery.isLoading]);

  const childCompanyFilterOptions = useMemo(() => {
    if (canFilterByResellerId && !filterResellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    if (!filterParentCompanyId.trim()) {
      return [{ value: "", label: "Select parent company first" }];
    }
    const children = extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      filterParentCompanyId,
    );
    if (children.length > 0) {
      return [{ value: "", label: "All child companies" }, ...children];
    }
    return [
      {
        value: "",
        label: companiesTreeQuery.isLoading ? "Loading child companies…" : "No child companies",
      },
    ];
  }, [
    canFilterByResellerId,
    filterResellerId,
    filterParentCompanyId,
    companiesTreeQuery.data,
    companiesTreeQuery.isLoading,
  ]);

  const hasScopeFilters = Boolean(
    filterResellerId.trim() || filterParentCompanyId.trim() || filterChildCompanyId.trim(),
  );

  const clearScopeFilters = () => {
    setFilterResellerId(canFilterByResellerId ? "" : sessionResellerId ?? "");
    setFilterParentCompanyId("");
    setFilterChildCompanyId("");
  };

  return {
    filterResellerId,
    filterParentCompanyId,
    filterChildCompanyId,
    setFilterResellerId,
    setFilterParentCompanyId,
    setFilterChildCompanyId,
    resellerFilterOptions,
    parentCompanyFilterOptions,
    childCompanyFilterOptions,
    canFilterByResellerId,
    hasScopeFilters,
    clearScopeFilters,
  };
}
