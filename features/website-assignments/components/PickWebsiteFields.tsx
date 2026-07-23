import { useEffect, useMemo } from "react";
import { View } from "react-native";

import { SelectField, Typography } from "@/components/ui";
import { useResellerListScope } from "@/lib/auth";
import {
    extractChildCompanyOptionsForParentFromByResellerTree,
    extractParentCompaniesFromByResellerTree,
    pickItemsArray,
    toIdNameOption,
} from "@/lib/companies/scope-tree-options";
import {
    buildWebsitesInScopeParams,
    useCompaniesSetupResellersQuery,
    useScopedCompanyTreeQuery,
    useWebsiteAssignmentsWebsitesQuery,
} from "@/lib/hooks";
import { websiteAssignmentItemToSelectOption } from "@/lib/websites/format-website-select-label";
import { tokens } from "@/theme/tokens";
import type { PickWebsitePreset } from "./PickWebsiteModal";

export type PickWebsiteFieldsProps = {
  value: PickWebsitePreset;
  onChange: (next: PickWebsitePreset) => void;
  /** Hide websites that already have a distribution setup (new wizard only). */
  excludeWebsiteIds?: readonly string[];
  /** Hide inline Parent / Child / Website progress hint when a page-level flow stepper is shown. */
  showProgressChips?: boolean;
  /** Show all org fields at once (web assign step 1 layout). */
  flatLayout?: boolean;
};

export function PickWebsiteFields({
  value,
  onChange,
  excludeWebsiteIds,
  showProgressChips = true,
  flatLayout = false,
}: PickWebsiteFieldsProps) {
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();

  const resellerId = value.resellerId ?? "";
  const parentCompanyId = value.parentCompanyId ?? "";
  const childCompanyId = value.childCompanyId ?? "";
  const websiteId = value.websiteId ?? "";

  /** Assign step 1: reseller pick drives `/companies?view=tree&…&resellerId=` like web. */
  const filterByReseller = canFilterByResellerId || flatLayout;

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId && !resellerId) {
      onChange({ ...value, resellerId: sessionResellerId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed reseller once for scoped agents
  }, [canFilterByResellerId, sessionResellerId]);

  const resellersQuery = useCompaniesSetupResellersQuery({
    enabled: filterByReseller,
  });

  // Reseller selected → GET /companies?view=tree&sortBy=name&sortOrder=asc&all=true&resellerId=
  const companiesTreeQuery = useScopedCompanyTreeQuery(
    resellerId,
    filterByReseller,
    sessionResellerId,
    {
      enabled: filterByReseller ? resellerId.trim().length > 0 : true,
    },
  );

  const resellerOptions = useMemo(() => {
    const opts = pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    return opts.length
      ? [{ value: "", label: "All resellers" }, ...opts]
      : [{ value: "", label: "All resellers" }];
  }, [resellersQuery.data]);

  const parentCompanyOptions = useMemo(() => {
    if (filterByReseller && !resellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(
      companiesTreeQuery.data,
    ).map((o) => ({
      value: o.value,
      label: o.label,
    }));
    return extracted.length
      ? [{ value: "", label: "Select parent company" }, ...extracted]
      : [{ value: "", label: "No parent companies" }];
  }, [filterByReseller, resellerId, companiesTreeQuery.data]);

  const childCompanyOptions = useMemo(() => {
    if (!parentCompanyId.trim())
      return [{ value: "", label: "Select parent company first" }];
    const children = extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      parentCompanyId,
    );
    return children.length
      ? [{ value: "", label: "Select child company" }, ...children]
      : [{ value: "", label: "No child companies" }];
  }, [parentCompanyId, companiesTreeQuery.data]);

  // Parent selected → GET /website-assignments/websites?all=true&resellerId=&parentCompanyId=
  // Child selected → same + &childCompanyId=
  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(
    buildWebsitesInScopeParams({
      canFilterByResellerId: filterByReseller,
      all: true,
      resellerId,
      parentCompanyId,
      childCompanyId: childCompanyId.trim() || undefined,
    }),
    {
      allowResellerIdFilter: filterByReseller,
      enabled:
        parentCompanyId.trim().length > 0 &&
        (filterByReseller ? resellerId.trim().length > 0 : true),
    },
  );

  const excludeSet = useMemo(
    () =>
      new Set((excludeWebsiteIds ?? []).map((id) => id.trim()).filter(Boolean)),
    [excludeWebsiteIds],
  );

  const websiteItems = useMemo(
    () => websitesQuery.data?.data?.items ?? [],
    [websitesQuery.data?.data?.items],
  );

  const availableWebsiteItems = useMemo(
    () => websiteItems.filter((w) => !excludeSet.has(w.websiteId)),
    [websiteItems, excludeSet],
  );

  const websiteSelectOptions = useMemo(() => {
    if (!parentCompanyId.trim() || !childCompanyId.trim()) {
      return [{ value: "", label: "No websites for this selection" }];
    }
    if (!websiteItems.length) {
      return [
        {
          value: "",
          label: websitesQuery.isFetching
            ? "Loading…"
            : "No websites for this selection",
        },
      ];
    }
    if (!availableWebsiteItems.length) {
      return [
        {
          value: "",
          label: excludeSet.size
            ? "All websites here already have distribution"
            : "No websites for this selection",
        },
      ];
    }
    return [
      { value: "", label: "Select website" },
      ...availableWebsiteItems.map((w) =>
        websiteAssignmentItemToSelectOption(w),
      ),
    ];
  }, [
    parentCompanyId,
    childCompanyId,
    websiteItems,
    availableWebsiteItems,
    websitesQuery.isFetching,
    excludeSet.size,
  ]);

  useEffect(() => {
    if (!websiteId.trim() || !excludeSet.has(websiteId)) return;
    onChange({ ...value, websiteId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear invalid selection once exclusions load
  }, [excludeSet, websiteId]);

  const wizardStep: 1 | 2 | 3 = !parentCompanyId.trim()
    ? 1
    : !childCompanyId.trim()
      ? 2
      : 3;

  return (
    <View style={{ gap: tokens.space.lg }}>
      {showProgressChips && !flatLayout ? (
        <View style={{ flexDirection: "row", gap: 6 }}>
          {[
            { n: 1, label: "Parent" },
            { n: 2, label: "Child company" },
            { n: 3, label: "Website" },
          ].map(({ n, label }) => (
            <View
              key={n}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor:
                  wizardStep >= n
                    ? `${tokens.colors.accentBlue}22`
                    : tokens.colors.surface,
              }}
            >
              <Typography
                variant="small"
                color={
                  wizardStep >= n
                    ? tokens.colors.accentBlue
                    : tokens.colors.textMuted
                }
              >
                {n}. {label}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}

      {flatLayout ? (
        <View style={{ gap: tokens.space.sm }}>
          <SelectField
            label="Reseller"
            value={resellerId}
            onChange={(v) =>
              onChange({
                resellerId: v,
                parentCompanyId: "",
                childCompanyId: "",
                websiteId: "",
              })
            }
            options={resellerOptions}
            searchable={false}
            disabled={!canFilterByResellerId && Boolean(sessionResellerId)}
          />
          <SelectField
            label="Parent company"
            value={parentCompanyId}
            onChange={(v) =>
              onChange({
                ...value,
                parentCompanyId: v,
                childCompanyId: "",
                websiteId: "",
              })
            }
            options={parentCompanyOptions}
            searchable={false}
            disabled={!resellerId.trim()}
          />
          <SelectField
            label="Child company"
            value={childCompanyId}
            onChange={(v) =>
              onChange({ ...value, childCompanyId: v, websiteId: "" })
            }
            options={childCompanyOptions}
            searchable={false}
            disabled={!parentCompanyId.trim()}
          />
          <SelectField
            label="Website"
            value={websiteId}
            onChange={(v) => onChange({ ...value, websiteId: v })}
            options={websiteSelectOptions}
            searchable={false}
            disabled={!childCompanyId.trim()}
          />
        </View>
      ) : (
        <>
          <View style={{ gap: tokens.space.sm }}>
            <Typography variant="medium16">1. Parent company</Typography>
            <Typography variant="small" muted>
              Pick the client root company for this setup.
            </Typography>
            {canFilterByResellerId ? (
              <SelectField
                label="Reseller"
                value={resellerId}
                onChange={(v) =>
                  onChange({
                    resellerId: v,
                    parentCompanyId: "",
                    childCompanyId: "",
                    websiteId: "",
                  })
                }
                options={resellerOptions}
                searchable={false}
              />
            ) : null}
            <SelectField
              label="Parent company"
              value={parentCompanyId}
              onChange={(v) =>
                onChange({
                  ...value,
                  parentCompanyId: v,
                  childCompanyId: "",
                  websiteId: "",
                })
              }
              options={parentCompanyOptions}
              searchable={false}
              disabled={canFilterByResellerId && !resellerId.trim()}
            />
          </View>

          {parentCompanyId.trim() ? (
            <View style={{ gap: tokens.space.sm }}>
              <Typography variant="medium16">2. Child company</Typography>
              <Typography variant="small" muted>
                Required — distribution is configured per website under a child
                company.
              </Typography>
              <SelectField
                label="Child company"
                value={childCompanyId}
                onChange={(v) =>
                  onChange({ ...value, childCompanyId: v, websiteId: "" })
                }
                options={childCompanyOptions}
                searchable={false}
              />
            </View>
          ) : null}

          {childCompanyId.trim() ? (
            <View style={{ gap: tokens.space.sm }}>
              <Typography variant="medium16">3. Website</Typography>
              <Typography variant="small" muted>
                {excludeSet.size > 0
                  ? "Websites with an existing distribution setup are hidden."
                  : "Select the website for this configuration."}
              </Typography>
              <SelectField
                label="Website"
                value={websiteId}
                onChange={(v) => onChange({ ...value, websiteId: v })}
                options={websiteSelectOptions}
                searchable={false}
              />
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

export function isPickWebsiteComplete(preset: PickWebsitePreset): boolean {
  return Boolean(preset.websiteId?.trim() && preset.parentCompanyId?.trim());
}
