import { useEffect, useMemo, useState } from "react";
import {
  extractChildCompanyOptionsForParentFromByResellerTree,
  extractParentCompaniesFromByResellerTree,
  pickItemsArray,
  toIdNameOption,
} from "@/lib/companies/scope-tree-options";
import { useAuth } from "@/lib/auth";
import {
  getSessionResellerId,
  mayPassResellerIdListFilter,
} from "@/lib/companies/reseller-list-filter";
import {
  useCompaniesByResellerQuery,
  useCompaniesSetupResellersQuery,
  useWebsiteAssignmentsWebsitesQuery,
} from "@/lib/hooks";
import { extractApiErrorMessageForToast } from "@/lib/notify/extract-api-message";
import { websiteAssignmentItemToSelectOption } from "@/lib/websites/format-website-select-label";

export function useAiTrainingHierarchy() {
  const { user } = useAuth();
  const sessionResellerId = getSessionResellerId(user);
  const mayPickResellerFilter = mayPassResellerIdListFilter(user);

  const [resellerId, setResellerId] = useState("");
  const [parentCompanyId, setParentCompanyId] = useState("");
  const [childCompanyId, setChildCompanyId] = useState("");
  const [websiteId, setWebsiteId] = useState("");

  useEffect(() => {
    if (!sessionResellerId || resellerId.trim()) return;
    setResellerId(sessionResellerId);
  }, [sessionResellerId, resellerId]);

  useEffect(() => {
    const parentFromSession = user?.parentCompanyId?.trim();
    if (!parentFromSession || parentCompanyId.trim()) return;
    if (user?.wideResellerScope) return;
    if (mayPickResellerFilter) return;
    setParentCompanyId(parentFromSession);
  }, [
    user?.parentCompanyId,
    user?.wideResellerScope,
    parentCompanyId,
    mayPickResellerFilter,
  ]);

  const hierarchyResellerKey = resellerId.trim() || sessionResellerId || "";

  const resellersQuery = useCompaniesSetupResellersQuery({ enabled: true });
  const companiesByResellerQuery = useCompaniesByResellerQuery(
    hierarchyResellerKey,
    { view: "tree", sortBy: "name", sortOrder: "asc", all: true },
    {
      enabled: mayPickResellerFilter ? hierarchyResellerKey.length > 0 : true,
    },
  );

  const websitesParams = useMemo(
    () => ({
      all: true as const,
      resellerId: resellerId.trim() || undefined,
      parentCompanyId: parentCompanyId.trim() || undefined,
      childCompanyId: childCompanyId.trim() || undefined,
    }),
    [resellerId, parentCompanyId, childCompanyId],
  );

  const hierarchyReady =
    Boolean(hierarchyResellerKey) &&
    Boolean(parentCompanyId.trim()) &&
    Boolean(childCompanyId.trim());

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(websitesParams, {
    enabled: hierarchyReady,
  });

  const resellerOptions = useMemo(() => {
    return pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
  }, [resellersQuery.data]);

  const resellerSelectOptions = useMemo(() => {
    if (resellerOptions.length === 0) {
      return [
        {
          value: "",
          label: resellersQuery.isLoading ? "Loading resellers…" : "No resellers available",
        },
      ];
    }
    return [{ value: "", label: "Select reseller" }, ...resellerOptions];
  }, [resellerOptions, resellersQuery.isLoading]);

  const parentCompanyOptions = useMemo(() => {
    if (!hierarchyResellerKey) return [{ value: "", label: "Select reseller first" }];
    const extracted = extractParentCompaniesFromByResellerTree(companiesByResellerQuery.data).map(
      (o) => ({ value: o.value, label: o.label }),
    );
    if (extracted.length > 0) {
      return [{ value: "", label: "Select parent company" }, ...extracted];
    }
    return [
      {
        value: "",
        label: companiesByResellerQuery.isLoading
          ? "Loading parent companies…"
          : "No parent companies available",
      },
    ];
  }, [hierarchyResellerKey, companiesByResellerQuery.data, companiesByResellerQuery.isLoading]);

  const childCompanyRows = useMemo(() => {
    if (!hierarchyResellerKey || !parentCompanyId.trim()) return [];
    return extractChildCompanyOptionsForParentFromByResellerTree(
      companiesByResellerQuery.data,
      parentCompanyId,
    );
  }, [hierarchyResellerKey, parentCompanyId, companiesByResellerQuery.data]);

  const childCompanyOptions = useMemo(() => {
    if (!hierarchyResellerKey) return [{ value: "", label: "Select reseller first" }];
    if (!parentCompanyId.trim()) return [{ value: "", label: "Select parent company first" }];
    if (childCompanyRows.length > 0) {
      return [{ value: "", label: "Select child company" }, ...childCompanyRows];
    }
    return [
      {
        value: "",
        label: companiesByResellerQuery.isLoading
          ? "Loading child companies…"
          : "No child companies for this parent",
      },
    ];
  }, [
    hierarchyResellerKey,
    parentCompanyId,
    childCompanyRows,
    companiesByResellerQuery.isLoading,
  ]);

  const websiteRows = useMemo(
    () => websitesQuery.data?.data?.items ?? [],
    [websitesQuery.data?.data?.items],
  );

  const websiteOptions = useMemo(() => {
    if (websiteRows.length === 0) {
      return [
        {
          value: "",
          label: websitesQuery.isFetching ? "Loading websites…" : "No websites for this child company",
        },
      ];
    }
    return [
      { value: "", label: "Select website" },
      ...websiteRows.map((w) => websiteAssignmentItemToSelectOption(w)),
    ];
  }, [websiteRows, websitesQuery.isFetching]);

  useEffect(() => {
    if (!websiteId || websiteRows.length === 0) return;
    const ok = websiteRows.some((w) => w.websiteId === websiteId);
    if (!ok) setWebsiteId("");
  }, [websiteRows, websiteId]);

  useEffect(() => {
    if (!childCompanyId || childCompanyRows.length === 0) return;
    const ok = childCompanyRows.some((c) => c.value === childCompanyId);
    if (!ok) setChildCompanyId("");
  }, [childCompanyRows, childCompanyId]);

  const companiesError = companiesByResellerQuery.isError
    ? extractApiErrorMessageForToast(companiesByResellerQuery.error) ??
      "Unable to load companies for this reseller."
    : null;

  const sitesError = websitesQuery.isError
    ? extractApiErrorMessageForToast(websitesQuery.error) ?? "Unable to load websites."
    : null;

  const websitesLoading = hierarchyReady && websitesQuery.isFetching && !websitesQuery.data;
  const hasWebsiteChoices = websiteRows.length > 0;

  const selectedWebsite = useMemo(() => {
    if (!websiteId.trim()) return null;
    const row = websiteRows.find((w) => w.websiteId === websiteId.trim());
    if (!row) return null;
    return {
      websiteId: row.websiteId,
      name: (row.name ?? "").trim() || "Website",
      url: (row.url ?? "").trim(),
    };
  }, [websiteId, websiteRows]);

  const onResellerChange = (v: string) => {
    setResellerId(v);
    setParentCompanyId("");
    setChildCompanyId("");
    setWebsiteId("");
  };

  const onParentChange = (v: string) => {
    setParentCompanyId(v);
    setChildCompanyId("");
    setWebsiteId("");
  };

  const onChildChange = (v: string) => {
    setChildCompanyId(v);
    setWebsiteId("");
  };

  const selectWebsiteFromTrainingRow = (row: {
    websiteId: string;
    childCompanyId: string;
    parentCompanyId: string;
    resellerId: string;
  }) => {
    if (row.resellerId) setResellerId(row.resellerId);
    if (row.parentCompanyId) setParentCompanyId(row.parentCompanyId);
    if (row.childCompanyId) setChildCompanyId(row.childCompanyId);
    setWebsiteId(row.websiteId);
  };

  return {
    sessionResellerId,
    mayPickResellerFilter,
    hierarchyResellerKey,
    hierarchyReady,
    resellerId,
    parentCompanyId,
    childCompanyId,
    websiteId,
    setWebsiteId,
    onResellerChange,
    onParentChange,
    onChildChange,
    resellersQuery,
    companiesByResellerQuery,
    resellerSelectOptions,
    parentCompanyOptions,
    childCompanyOptions,
    websiteOptions,
    companiesError,
    sitesError,
    websitesLoading,
    hasWebsiteChoices,
    selectedWebsite,
    websiteRows,
    selectWebsiteFromTrainingRow,
  };
}
