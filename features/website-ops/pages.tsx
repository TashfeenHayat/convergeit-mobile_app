import { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

import type { WebsiteDirectoryItem } from "@/api/types/companies.types";
import { MobileScreen } from "@/components/layout";
import {
    AppCard,
    Button,
    DataCardGrid,
    EntityListCard,
    ListTableCard,
    MetricCard,
    SearchBar,
    TablePagination,
    Typography,
} from "@/components/ui";
import { ApiResourceScreen } from "@/features/shared";
import { DashboardMetricGrid } from "@/features/dashboard/components/DashboardMetricGrid";
import { WebsiteAssignmentScopeFilterPanel } from "@/features/website-assignments/components/WebsiteAssignmentScopeFilterPanel";
import { useWebsiteAssignmentScopeFilters } from "@/features/website-assignments/hooks/useWebsiteAssignmentScopeFilters";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useWebsiteDirectoryQuery } from "@/lib/hooks/query/companies/hooks";
import { canViewWebsiteDirectory } from "@/lib/permissions";
import { useAppTheme } from "@/theme";
import { WebsiteScopeListScreen } from "./WebsiteScopeListScreen";

const PAGE_SIZE = 20;

function unwrapDirectory(payload: unknown): {
  items: WebsiteDirectoryItem[];
  total: number;
  totalPages: number;
} {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  const data =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;
  const items = Array.isArray(data?.items)
    ? (data.items as WebsiteDirectoryItem[])
    : [];
  const total = Number(data?.total ?? items.length) || 0;
  const limit = Number(data?.limit ?? PAGE_SIZE) || PAGE_SIZE;
  const totalPages = Math.max(
    1,
    Number(data?.totalPages ?? (Math.ceil(total / limit) || 1)),
  );
  return { items, total, totalPages };
}

function directoryCardProps(item: WebsiteDirectoryItem) {
  const websiteTitle =
    (item.url || "").trim() ||
    (item.name !== "—" ? item.name : "") ||
    item.websiteId.slice(0, 8);
  const poc = item.pocs?.[0];
  const pocLabel = poc
    ? [poc.name, poc.email].filter(Boolean).join(" · ")
    : "—";
  const createdByLabel = [item.createdByName, item.createdByEmail]
    .filter(Boolean)
    .join(" · ");
  const createdLabel = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString()
    : "—";
  const typeLabel = (item.createdByUserType || "").trim();

  return {
    title: websiteTitle,
    subtitle:
      item.name && item.name !== "—" && item.name !== websiteTitle
        ? item.name
        : undefined,
    details: [
      { label: "Reseller", value: item.resellerName || "—" },
      { label: "Parent company", value: item.parentCompanyName || "—" },
      { label: "Child company", value: item.childCompanyName || "—" },
      { label: "POC", value: pocLabel },
      { label: "Created by", value: createdByLabel || "—" },
      { label: "Role (at creation)", value: item.createdByRoleName || "—" },
      { label: "Created", value: createdLabel },
    ],
    badgeLabel: typeLabel || undefined,
    badgeTone: (typeLabel.toLowerCase() === "internal"
      ? "internal"
      : typeLabel.toLowerCase() === "external"
        ? "external"
        : "neutral") as "internal" | "external" | "neutral",
  };
}

/** Website directory — GET /companies/website-directory (web parity). */
export function WebsitesDirectoryPage() {
  const theme = useAppTheme();
  const { hasPage, hasOperational } = useAuth();
  const canView = canViewWebsiteDirectory(hasPage, hasOperational);
  const scope = useWebsiteAssignmentScopeFilters();
  const accent = theme.app.dashboard.accentBlue;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const scopeFilters = useMemo(
    () => ({
      ...(scope.canFilterByResellerId && scope.filterResellerId.trim()
        ? { resellerId: scope.filterResellerId.trim() }
        : {}),
      ...(scope.filterParentCompanyId.trim()
        ? { parentCompanyId: scope.filterParentCompanyId.trim() }
        : {}),
      ...(scope.filterChildCompanyId.trim()
        ? { childCompanyId: scope.filterChildCompanyId.trim() }
        : {}),
    }),
    [
      scope.canFilterByResellerId,
      scope.filterResellerId,
      scope.filterParentCompanyId,
      scope.filterChildCompanyId,
    ],
  );

  useEffect(() => {
    setPage(1);
  }, [
    scope.filterResellerId,
    scope.filterParentCompanyId,
    scope.filterChildCompanyId,
    search,
  ]);

  const listQuery = useWebsiteDirectoryQuery(
    {
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      ...scopeFilters,
    },
    { enabled: canView },
  );

  const statsQuery = useWebsiteDirectoryQuery(
    { all: true, search: search.trim() || undefined, ...scopeFilters },
    { enabled: canView },
  );

  const payload = useMemo(
    () => unwrapDirectory(listQuery.data),
    [listQuery.data],
  );
  const statsPayload = useMemo(
    () => unwrapDirectory(statsQuery.data),
    [statsQuery.data],
  );
  const statsItems = statsPayload.items;
  const items = payload.items;
  const total = payload.total;
  const totalPages = payload.totalPages;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const uniqueResellers = useMemo(
    () => new Set(statsItems.map((r) => r.resellerId)).size,
    [statsItems],
  );
  const uniqueParents = useMemo(
    () => new Set(statsItems.map((r) => r.parentCompanyId)).size,
    [statsItems],
  );

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to view the website directory.
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
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isLoading}
            onRefresh={() => void listQuery.refetch()}
            tintColor={accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Typography variant="boldLarge">Website directory</Typography>
          <Typography variant="medium" muted style={{ marginTop: 4 }}>
            Reseller, companies, POC, and creator for each website.
          </Typography>
        </View>

        <DashboardMetricGrid>
          <MetricCard
            title="Websites"
            value={statsQuery.isLoading ? "…" : String(statsPayload.total)}
            subtitle="In scope"
            showTrendArrow={false}
            valueColor={accent}
            iconBgColor="rgba(0, 132, 255, 0.2)"
            icon={<Ionicons name="globe-outline" size={18} color={accent} />}
          />
          <MetricCard
            title="Resellers"
            value={String(uniqueResellers)}
            subtitle="Unique"
            showTrendArrow={false}
            valueColor={accent}
            iconBgColor="rgba(88, 101, 242, 0.18)"
            icon={<Ionicons name="business-outline" size={18} color={accent} />}
          />
          <MetricCard
            title="Parents"
            value={String(uniqueParents)}
            subtitle="Companies"
            showTrendArrow={false}
            valueColor={theme.app.dashboard.accentGreen}
            iconBgColor="rgba(34, 197, 94, 0.18)"
            icon={
              <Ionicons
                name="layers-outline"
                size={18}
                color={theme.app.dashboard.accentGreen}
              />
            }
          />
        </DashboardMetricGrid>

        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search URL, company, POC…"
            />
          </View>
          <Button
            size="compact"
            variant="secondary"
            onPress={() => {
              setSearch(searchInput.trim());
              setPage(1);
            }}
          >
            Search
          </Button>
        </View>

        <Button
          variant="outlined"
          size="compact"
          onPress={() => setFiltersOpen((v) => !v)}
        >
          {filtersOpen ? "Hide scope filters" : "Scope filters"}
        </Button>

        {filtersOpen ? (
          <WebsiteAssignmentScopeFilterPanel
            filterResellerId={scope.filterResellerId}
            filterParentCompanyId={scope.filterParentCompanyId}
            filterChildCompanyId={scope.filterChildCompanyId}
            setFilterResellerId={scope.setFilterResellerId}
            setFilterParentCompanyId={scope.setFilterParentCompanyId}
            setFilterChildCompanyId={scope.setFilterChildCompanyId}
            resellerFilterOptions={scope.resellerFilterOptions}
            parentCompanyFilterOptions={scope.parentCompanyFilterOptions}
            childCompanyFilterOptions={scope.childCompanyFilterOptions}
            canFilterByResellerId={scope.canFilterByResellerId}
            hasScopeFilters={scope.hasScopeFilters}
            onClearAll={scope.clearScopeFilters}
          />
        ) : null}

        {listQuery.isError ? (
          <AppCard style={{ gap: 10 }}>
            <Typography variant="medium" color={theme.app.danger}>
              {extractApiErrorMessage(
                listQuery.error,
                "Could not load websites.",
              )}
            </Typography>
            <Button
              size="compact"
              variant="outlined"
              onPress={() => void listQuery.refetch()}
            >
              Retry
            </Button>
          </AppCard>
        ) : (
          <ListTableCard
            title={`Websites (${total})`}
            subtitle="Directory of sites in your scope"
            icon="globe-outline"
            toolbar={null}
          >
            <DataCardGrid
              columns={1}
              isLoading={listQuery.isLoading && !listQuery.data}
              empty={!listQuery.isLoading && items.length === 0}
              emptyState={{
                title: "No websites found",
                description:
                  "Try clearing filters or searching a different company.",
                icon: "globe-outline",
              }}
              showingLabel={
                items.length > 0
                  ? `Showing data ${from} to ${to} of ${total} entries`
                  : undefined
              }
              footerRight={
                <TablePagination
                  page={page}
                  pageCount={totalPages}
                  onPageChange={setPage}
                />
              }
            >
              {items.map((item) => (
                <EntityListCard
                  key={item.websiteId}
                  {...directoryCardProps(item)}
                />
              ))}
            </DataCardGrid>
          </ListTableCard>
        )}
      </ScrollView>
    </MobileScreen>
  );
}

export function ServiceSchedulesListPage() {
  return (
    <WebsiteScopeListScreen
      title="Service schedules"
      description="Websites with service hours for chat routing."
      icon="time-outline"
      mode="scheduling"
      detailRoute={(id) =>
        `/website-assigning/website/${id}/service-scheduling`
      }
      addRoute="/website-assigning/service-schedules/add"
    />
  );
}

export function InquireTopicsListPage() {
  return (
    <WebsiteScopeListScreen
      title="Inquire Topics"
      description="Configure visitor inquire topics per website. Service hours are set separately under Service scheduling."
      icon="folder-outline"
      mode="topics"
      detailRoute={(id) => `/website-assigning/website/${id}/inquire-topics`}
      addRoute="/website-assigning/inquire-topics/add"
    />
  );
}

export function PhoneNumberSetupListPage() {
  return (
    <ApiResourceScreen
      title="Text Us / phone setup"
      description="SMS and phone channel numbers per website."
      icon="call-outline"
      queryKey={["website-sms-configs"]}
      queryFn={async (params) => {
        const { data } = await (
          await import("@/api/http/axios-instance")
        ).apiClient.get("/website-sms-configs", { params });
        return data;
      }}
      columnIds={["websiteName", "phoneNumber", "status"]}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  scroll: { paddingBottom: 28 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
