import { useEffect, useMemo } from "react";
import { View } from "react-native";

import { SelectField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
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
import type { PickWebsitePreset } from "./PickWebsiteModal";

export type PickWebsiteFieldsProps = {
  value: PickWebsitePreset;
  onChange: (next: PickWebsitePreset) => void;
  /** Hide websites that already have a distribution setup (new wizard only). */
  excludeWebsiteIds?: readonly string[];
  /** Hide inline Parent / Child / Website progress hint when a page-level flow stepper is shown. */
  showProgressChips?: boolean;
};

export function PickWebsiteFields({
  value,
  onChange,
  excludeWebsiteIds,
  showProgressChips = true,
}: PickWebsiteFieldsProps) {
  const { canFilterByResellerId, sessionResellerId } = useResellerListScope();

  const resellerId = value.resellerId ?? "";
  const parentCompanyId = value.parentCompanyId ?? "";
  const childCompanyId = value.childCompanyId ?? "";
  const websiteId = value.websiteId ?? "";

  useEffect(() => {
    if (!canFilterByResellerId && sessionResellerId && !resellerId) {
      onChange({ ...value, resellerId: sessionResellerId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed reseller once for scoped agents
  }, [canFilterByResellerId, sessionResellerId]);

  const resellersQuery = useCompaniesSetupResellersQuery({ enabled: canFilterByResellerId });
  const companiesTreeQuery = useScopedCompanyTreeQuery(
    resellerId,
    canFilterByResellerId,
    sessionResellerId,
    { enabled: canFilterByResellerId ? resellerId.trim().length > 0 : true },
  );

  const resellerOptions = useMemo(() => {
    const opts = pickItemsArray(resellersQuery.data)
      .map((row) => toIdNameOption(row))
      .filter((o): o is { value: string; label: string } => o !== null);
    return opts.length
      ? [{ value: "", label: "Select reseller" }, ...opts]
      : [{ value: "", label: "No resellers" }];
  }, [resellersQuery.data]);

  const parentCompanyOptions = useMemo(() => {
    if (canFilterByResellerId && !resellerId.trim()) {
      return [{ value: "", label: "Select reseller first" }];
    }
    const extracted = extractParentCompaniesFromByResellerTree(companiesTreeQuery.data).map((o) => ({
      value: o.value,
      label: o.label,
    }));
    return extracted.length
      ? [{ value: "", label: "Select parent company" }, ...extracted]
      : [{ value: "", label: "No parent companies" }];
  }, [canFilterByResellerId, resellerId, companiesTreeQuery.data]);

  const childCompanyOptions = useMemo(() => {
    if (!parentCompanyId.trim()) return [{ value: "", label: "Select parent company first" }];
    const children = extractChildCompanyOptionsForParentFromByResellerTree(
      companiesTreeQuery.data,
      parentCompanyId,
    );
    return children.length
      ? [{ value: "", label: "Select child company" }, ...children]
      : [{ value: "", label: "No child companies" }];
  }, [parentCompanyId, companiesTreeQuery.data]);

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(
    buildWebsitesInScopeParams({
      canFilterByResellerId,
      all: true,
      resellerId,
      parentCompanyId,
      childCompanyId: childCompanyId.trim() || undefined,
    }),
    {
      allowResellerIdFilter: canFilterByResellerId,
      enabled:
        parentCompanyId.trim().length > 0 &&
        childCompanyId.trim().length > 0 &&
        (canFilterByResellerId ? resellerId.trim().length > 0 : true),
    },
  );

  const excludeSet = useMemo(
    () => new Set((excludeWebsiteIds ?? []).map((id) => id.trim()).filter(Boolean)),
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
    if (!websiteItems.length) {
      return [{ value: "", label: websitesQuery.isFetching ? "Loading…" : "No websites yet" }];
    }
    if (!availableWebsiteItems.length) {
      return [
        {
          value: "",
          label: excludeSet.size ? "All websites here already have distribution" : "No websites yet",
        },
      ];
    }
    return [
      { value: "", label: "Select website" },
      ...availableWebsiteItems.map((w) => websiteAssignmentItemToSelectOption(w)),
    ];
  }, [websiteItems, availableWebsiteItems, websitesQuery.isFetching, excludeSet.size]);

  useEffect(() => {
    if (!websiteId.trim() || !excludeSet.has(websiteId)) return;
    onChange({ ...value, websiteId: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear invalid selection once exclusions load
  }, [excludeSet, websiteId]);

  const wizardStep: 1 | 2 | 3 = !parentCompanyId.trim() ? 1 : !childCompanyId.trim() ? 2 : 3;

  return (
    <View style={{ gap: tokens.space.lg }}>
      {showProgressChips ? (
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
                backgroundColor: wizardStep >= n ? `${tokens.colors.accentBlue}22` : tokens.colors.surface,
              }}
            >
              <Typography
                variant="small"
                color={wizardStep >= n ? tokens.colors.accentBlue : tokens.colors.textMuted}
              >
                {n}. {label}
              </Typography>
            </View>
          ))}
        </View>
      ) : null}

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
              onChange({ resellerId: v, parentCompanyId: "", childCompanyId: "", websiteId: "" })
            }
            options={resellerOptions}
            searchable={false}
          />
        ) : null}
        <SelectField
          label="Parent company"
          value={parentCompanyId}
          onChange={(v) => onChange({ ...value, parentCompanyId: v, childCompanyId: "", websiteId: "" })}
          options={parentCompanyOptions}
          searchable={false}
          disabled={canFilterByResellerId && !resellerId.trim()}
        />
      </View>

      {parentCompanyId.trim() ? (
        <View style={{ gap: tokens.space.sm }}>
          <Typography variant="medium16">2. Child company</Typography>
          <Typography variant="small" muted>
            Required — distribution is configured per website under a child company.
          </Typography>
          <SelectField
            label="Child company"
            value={childCompanyId}
            onChange={(v) => onChange({ ...value, childCompanyId: v, websiteId: "" })}
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
    </View>
  );
}

export function isPickWebsiteComplete(preset: PickWebsitePreset): boolean {
  return Boolean(preset.websiteId?.trim() && preset.parentCompanyId?.trim());
}
