import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import type {
  CompaniesData,
  CompanyListItem,
  PaginatedCompaniesData,
  PaginatedCompaniesTreeData,
} from "@/api/types/companies.types";
import { MobileScreen } from "@/components/layout";
import { DashboardPageIntro } from "@/components/layout/DashboardPageIntro";
import {
  AppCard,
  Button,
  DataCardGrid,
  EntityListCard,
  FormModal,
  ListTableCard,
  SearchBar,
  TablePagination,
  Typography,
} from "@/components/ui";
import { CompaniesStatsCards } from "@/features/companies/components/CompaniesStatsCards";
import { CompanySetupDraftsModal } from "@/features/companies/components/CompanySetupDraftsModal";
import { CompanySetupWizardModal } from "@/features/companies/components/CompanySetupWizardModal";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { parseCompanySetupDraftsList } from "@/lib/companies/setup-drafts-list.utils";
import {
  useCompaniesListQuery,
  useCompanySetupDraftsListQuery,
} from "@/lib/hooks/query/companies/hooks";
import { canCompaniesModuleAction } from "@/lib/permissions";
import { glassUi } from "@/lib/theme/glass-ui";
import { hexAlpha, useThemeColors } from "@/lib/theme/use-theme-colors";
import { useAppTheme } from "@/theme";

const PAGE_SIZE = 20;

type ParentListItem = {
  id: string;
  name: string;
  childCount: number;
  childHint?: string;
};

type ResellerRow = {
  id: string;
  name: string;
  parentCount: number;
  childCount: number;
  firstParentId?: string;
  parents: ParentListItem[];
};

function isTreeData(
  data: CompaniesData | undefined,
): data is PaginatedCompaniesTreeData {
  return Boolean(data && "view" in data && data.view === "tree");
}

function toResellerRows(data: CompaniesData | undefined): ResellerRow[] {
  if (!data) return [];

  if (isTreeData(data)) {
    return data.items
      .map((item) => {
        const resellerId = item.reseller?.id?.trim();
        const name = item.reseller?.name?.trim() || "—";
        const parentsRaw = item.parentCompanies ?? [];
        const parents: ParentListItem[] = parentsRaw
          .map((p) => {
            const id = p.id?.trim() || "";
            const childCompanies = p.childCompanies ?? [];
            return {
              id,
              name: p.name?.trim() || "—",
              childCount: childCompanies.length,
              childHint: childCompanies[0]?.name?.trim() || undefined,
            };
          })
          .filter((p) => p.id.length > 0);
        const childCount = parents.reduce((sum, p) => sum + p.childCount, 0);
        return {
          id: resellerId || name,
          name,
          parentCount: parents.length,
          childCount,
          firstParentId: parents[0]?.id,
          parents,
        };
      })
      .filter((r) => r.id.length > 0);
  }

  const flat = data as PaginatedCompaniesData;
  const byReseller = new Map<string, ResellerRow>();
  for (const item of flat.items ?? ([] as CompanyListItem[])) {
    const resellerId =
      item.parentCompany?.reseller?.id?.trim() ||
      item.parentCompanyId?.trim() ||
      item.id;
    const name =
      item.parentCompany?.reseller?.name?.trim() ||
      item.parentCompany?.name?.trim() ||
      item.name ||
      "—";
    const existing = byReseller.get(resellerId);
    if (!existing) {
      const parents: ParentListItem[] =
        item.companyType === "parent"
          ? [
              {
                id: item.id,
                name: item.name,
                childCount: 0,
              },
            ]
          : item.parentCompanyId
            ? [
                {
                  id: item.parentCompanyId,
                  name: item.parentCompany?.name?.trim() || "—",
                  childCount: 1,
                  childHint: item.name,
                },
              ]
            : [];
      byReseller.set(resellerId, {
        id: resellerId,
        name,
        parentCount: item.companyType === "parent" ? 1 : 0,
        childCount: item.companyType === "child" ? 1 : 0,
        firstParentId:
          item.companyType === "parent"
            ? item.id
            : (item.parentCompanyId ?? undefined),
        parents,
      });
    } else {
      if (item.companyType === "parent") {
        existing.parentCount += 1;
        if (!existing.parents.some((p) => p.id === item.id)) {
          existing.parents.push({
            id: item.id,
            name: item.name,
            childCount: 0,
          });
        }
      } else {
        existing.childCount += 1;
        const parentId = item.parentCompanyId?.trim();
        if (parentId) {
          const parent = existing.parents.find((p) => p.id === parentId);
          if (parent) {
            parent.childCount += 1;
            if (!parent.childHint) parent.childHint = item.name;
          } else {
            existing.parents.push({
              id: parentId,
              name: item.parentCompany?.name?.trim() || "—",
              childCount: 1,
              childHint: item.name,
            });
            existing.parentCount += 1;
          }
        }
      }
      if (!existing.firstParentId) {
        existing.firstParentId =
          item.companyType === "parent"
            ? item.id
            : (item.parentCompanyId ?? undefined);
      }
    }
  }
  return [...byReseller.values()];
}

function ActionChip({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionChip,
        {
          backgroundColor: colors.isLight
            ? hexAlpha("#0F172A", 0.08)
            : hexAlpha("#000000", 0.45),
          borderColor: colors.cardBorder,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Typography
        variant="small"
        color={colors.textPrimary}
        style={styles.actionChipLabel}
      >
        {label}
      </Typography>
    </Pressable>
  );
}

export function CompaniesListPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasPage, hasOperational } = useAuth();

  const canCreate = canCompaniesModuleAction(hasPage, hasOperational, "create");
  const canUpdate = canCompaniesModuleAction(hasPage, hasOperational, "update");
  const canViewDetail = canCompaniesModuleAction(
    hasPage,
    hasOperational,
    "detail",
  );
  const canOpenDrafts = canCreate || canUpdate;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [setupDraftId, setSetupDraftId] = useState<string | null>(null);
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [listModalRow, setListModalRow] = useState<ResellerRow | null>(null);

  const draftsListQuery = useCompanySetupDraftsListQuery({
    enabled: canOpenDrafts,
  });
  const draftCount = useMemo(
    () => parseCompanySetupDraftsList(draftsListQuery.data).length,
    [draftsListQuery.data],
  );

  const params = useMemo(
    () => ({
      view: "tree" as const,
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
    }),
    [page, search],
  );

  const query = useCompaniesListQuery(params);
  const data = query.data?.data as CompaniesData | undefined;
  const tree = isTreeData(data) ? data : undefined;

  const rows = useMemo(() => toResellerRows(data), [data]);

  const total = data?.total ?? rows.length;
  const pageCount = Math.max(
    1,
    data?.totalPages ?? Math.ceil(total / PAGE_SIZE),
  );
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const meta = tree?.meta ?? {
    resellerCount: 0,
    parentCompanyCount: 0,
    childCompanyCount: 0,
  };

  const openDetail = (row: ResellerRow) => {
    if (!canViewDetail) {
      Alert.alert(
        "Companies",
        "You do not have permission to open company details.",
      );
      return;
    }
    router.push(
      `/companies/reseller/${row.id}/detail?name=${encodeURIComponent(row.name)}` as never,
    );
  };

  const openList = (row: ResellerRow) => {
    if (!canUpdate && !canViewDetail) {
      Alert.alert(
        "Companies",
        "You do not have permission to open company list.",
      );
      return;
    }
    setListModalRow(row);
  };

  const openParentEdit = (parentId: string) => {
    setListModalRow(null);
    router.push(`/companies/${parentId}/edit?step=1` as never);
  };

  if (query.isLoading && !data) {
    return (
      <MobileScreen>
        <AppCard style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
          <Typography variant="medium" muted>
            Loading companies…
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={theme.app.dashboard.accentBlue}
          />
        }
      >
        <DashboardPageIntro subtitle="Resellers, parent companies, and client sites.">
          <SearchBar
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="Search companies…"
 />
          {canOpenDrafts || canCreate ? (
            <View style={styles.actionRow}>
              {canOpenDrafts ? (
                <Pressable
                  onPress={() => setDraftsModalOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Open drafts"
                  style={({ pressed }) => [
                    styles.draftCta,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.draftCtaIcon,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                        borderColor: glassUi.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={20}
                      color={theme.app.dashboard.accentBlue}
 />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="medium" style={{ fontWeight: "700" }}>
                      Draft{draftCount > 0 ? ` (${draftCount})` : ""}
                    </Typography>
                    <Typography variant="small" muted numberOfLines={1}>
                      Resume in-progress setups
                    </Typography>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={theme.app.text.secondary}
 />
                </Pressable>
              ) : null}

              {canCreate ? (
                <Pressable
                  onPress={() => {
                    setSetupDraftId(null);
                    setWizardOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Add company"
                  style={({ pressed }) => [
                    styles.addCta,
                    {
                      borderColor: theme.app.dashboard.cardBorder,
                      backgroundColor: theme.app.dashboard.overlayLight,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.985 : 1 }],
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.addCtaGlow,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}18`,
                      },
                    ]}
 />
                  <View
                    style={[
                      styles.addCtaIcon,
                      {
                        backgroundColor: theme.app.dashboard.accentBlue,
                        borderColor: `${theme.app.dashboard.accentBlue}66`,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.addCtaCopy}>
                    <Typography
                      variant="medium16"
                      style={{ fontWeight: "700" }}
                    >
                      Add company
                    </Typography>
                    <Typography variant="small" muted numberOfLines={2}>
                      Set up reseller, parent, child site & POC
                    </Typography>
                  </View>
                  <View
                    style={[
                      styles.addCtaChevron,
                      {
                        backgroundColor: `${theme.app.dashboard.accentBlue}22`,
                        borderColor: glassUi.border.subtle,
                      },
                    ]}
                  >
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={theme.app.dashboard.accentBlue}
 />
                  </View>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {draftCount > 0 ? (
            <Typography variant="small" muted>
              In-progress setups are in Draft — use Resume there. Add company
              always starts a new setup.
            </Typography>
          ) : null}
        </DashboardPageIntro>

        <CompaniesStatsCards
          resellerCount={meta.resellerCount}
          parentCompanyCount={meta.parentCompanyCount}
          childCompanyCount={meta.childCompanyCount}
 />

        {query.isError ? (
          <AppCard>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(query.error, "Could not load companies.")}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void query.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title="Add Reseller / Company"
            subtitle={`${total} result${total === 1 ? "" : "s"}`}
            icon="business-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              empty={rows.length === 0}
              emptyState={{
                title: "No companies found",
                description: search.trim()
                  ? "Try a different search, or add a new company."
                  : "Create your first reseller, parent, and child setup.",
                icon: "business-outline",
                action: canCreate ? (
                  <Button
                    size="compact"
                    onPress={() => {
                      setSetupDraftId(null);
                      setWizardOpen(true);
                    }}
                  >
                    Add company
                  </Button>
                ) : undefined,
              }}
              showingLabel={
                rows.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={pageCount}
                  onPageChange={setPage}
 />
              }
            >
              {rows.map((row) => (
                <EntityListCard
                  key={row.id}
                  title={row.name}
                  details={[
                    {
                      label: "Parent company",
                      value: `${row.parentCount} Parent Compan${row.parentCount === 1 ? "y" : "ies"}`,
                    },
                    {
                      label: "Child company",
                      value: `${row.childCount} Child Compan${row.childCount === 1 ? "y" : "ies"}`,
                    },
                  ]}
                  onPress={canViewDetail ? () => openDetail(row) : undefined}
                  badge={
                    <View style={styles.rowActions}>
                      <ActionChip
                        label="Detail"
                        onPress={() => openDetail(row)}
 />
                      <ActionChip label="List" onPress={() => openList(row)} />
                    </View>
                  }
 />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>

      <FormModal
        open={Boolean(listModalRow)}
        title={`${listModalRow?.name ?? "Reseller"} – Parent companies`}
        description={
          listModalRow
            ? `This reseller has ${listModalRow.parentCount} parent compan${listModalRow.parentCount === 1 ? "y" : "ies"}. Choose one to open the edit screen.`
            : undefined
        }
        onClose={() => setListModalRow(null)}
        onSave={() => setListModalRow(null)}
        primaryButtonLabel="Close"
        showCancelButton={false}
      >
        <View style={styles.listModalBody}>
          {(listModalRow?.parents ?? []).length === 0 ? (
            <Typography variant="medium" muted>
              No parent companies found for this reseller.
            </Typography>
          ) : (
            (listModalRow?.parents ?? []).map((parent) => (
              <View
                key={parent.id}
                style={[
                  styles.listModalRow,
                  {
                    borderColor: theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                  },
                ]}
              >
                <View style={styles.listModalCopy}>
                  <Typography
                    variant="medium16"
                    style={{ fontWeight: "700" }}
                    numberOfLines={1}
                  >
                    {parent.name}
                  </Typography>
                  <Typography variant="small" muted>
                    {parent.childCount} child compan
                    {parent.childCount === 1 ? "y" : "ies"}
                  </Typography>
                  {parent.childHint ? (
                    <Typography variant="small" muted numberOfLines={1}>
                      {parent.childHint}
                    </Typography>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => openParentEdit(parent.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${parent.name}`}
                  style={({ pressed }) => [
                    styles.listEditBtn,
                    {
                      backgroundColor: theme.app.dashboard.accentBlue,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    color="#FFFFFF"
                    style={{ fontWeight: "700" }}
                  >
                    Edit
                  </Typography>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </FormModal>

      <CompanySetupDraftsModal
        open={draftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
        onResume={(id) => {
          setSetupDraftId(id);
          setWizardOpen(true);
          setDraftsModalOpen(false);
        }}
        onStartNew={() => {
          setDraftsModalOpen(false);
          setSetupDraftId(null);
          setWizardOpen(true);
        }}
 />

      <CompanySetupWizardModal
        key={setupDraftId ?? "company-setup-new"}
        open={wizardOpen}
        draftId={setupDraftId}
        onClose={(reason) => {
          setWizardOpen(false);
          setSetupDraftId(null);
          if (reason === "completed" || reason === "dismissed") {
            void draftsListQuery.refetch();
            if (reason === "completed") void query.refetch();
          }
        }}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingBottom: 28 },
  actionRow: { gap: 10 },
  draftCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  draftCtaIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addCta: {
    position: "relative",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  addCtaGlow: {
    position: "absolute",
    top: -24,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  addCtaIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addCtaCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  addCtaChevron: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  actionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionChipLabel: {
    fontWeight: "600",
    fontSize: 12,
  },
  listModalBody: {
    gap: 10,
  },
  listModalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  listModalCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  listEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
