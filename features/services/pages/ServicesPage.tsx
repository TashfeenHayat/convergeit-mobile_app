import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, SearchBar, SegmentedControl, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { useAppTheme } from "@/theme";
import { getResellerModulesCatalog } from "@/api/companies/reseller-modules.api";
import type {
  ClientServicesAccessRow,
  ResellerServicesAccessRow,
} from "@/api/companies/services-access.api";
import {
  useClientServicesAccessQuery,
  useResellerServicesAccessQuery,
} from "@/lib/hooks/query/companies/services-access";
import { ClientServicesDetailModal } from "../components/ClientServicesDetailModal";
import { ResellerModulesEditModal } from "../components/ResellerModulesEditModal";
import { ModuleChips, OfferingTypeChip, formatServicesUpdatedAt } from "../components/services-shared";

type ServicesTab = "reseller" | "client";

/** Mobile-simplified — no data-table/pagination grid; scrollable cards + search. */
export function ServicesPage() {
  const theme = useAppTheme();
  const { hasPage, user } = useAuth();
  const isInternalUser = user?.userType === "Internal";
  const canView = isInternalUser && hasPage("page:account-setup");
  const canEditReseller = canView;

  const [tab, setTab] = useState<ServicesTab>("reseller");
  const [search, setSearch] = useState("");
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});
  const [editReseller, setEditReseller] = useState<{ resellerId: string; resellerName: string } | null>(
    null,
  );
  const [viewClient, setViewClient] = useState<ClientServicesAccessRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getResellerModulesCatalog();
        if (cancelled) return;
        const labels: Record<string, string> = {};
        for (const mod of res.data.modules ?? []) labels[mod.code] = mod.name;
        setModuleLabels(labels);
      } catch {
        // Chips fall back to raw codes.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listParams = useMemo(() => ({ page: 1, limit: 50, search: search.trim() || undefined }), [
    search,
  ]);

  const resellerQuery = useResellerServicesAccessQuery(listParams, {
    enabled: canView && tab === "reseller",
  });
  const clientQuery = useClientServicesAccessQuery(listParams, {
    enabled: canView && tab === "client",
  });

  const activeQuery = tab === "reseller" ? resellerQuery : clientQuery;
  const rows = activeQuery.data?.data.items ?? [];
  const total = activeQuery.data?.data.total ?? 0;

  if (!canView) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            Services is for platform internal users only. Reseller accounts cannot access this page.
          </Typography>
        </AppCard>
      </MobileScreen>
    );
  }

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Services & Access</Typography>
        <Typography variant="medium" muted>
          Reseller product modules and what each client inherits.
        </Typography>
        <SegmentedControl
          options={[
            { label: "Reseller", value: "reseller" },
            { label: "Client", value: "client" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as ServicesTab)}
 />
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={tab === "reseller" ? "Search resellers…" : "Search clients…"}
 />
        <Typography variant="small" muted>
          {total} {total === 1 ? "entry" : "entries"}
        </Typography>
      </View>

      {activeQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : activeQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(activeQuery.error, "Could not load services access.")}
          </Typography>
        </AppCard>
      ) : tab === "reseller" ? (
        <FlatList
          data={rows as ResellerServicesAccessRow[]}
          keyExtractor={(item) => item.resellerId}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No resellers found.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: theme.spacing.sm }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16">{item.name}</Typography>
                <OfferingTypeChip type={item.offeringType} />
              </View>
              <ModuleChips moduleCodes={item.moduleCodes} moduleLabels={moduleLabels} />
              <Typography variant="small" muted>
                {item.parentCompanyCount} clients · updated {formatServicesUpdatedAt(item.updatedAt)}
              </Typography>
              <Button
                size="compact"
                variant="outlined"
                onPress={() => setEditReseller({ resellerId: item.resellerId, resellerName: item.name })}
              >
                {canEditReseller ? "Edit" : "View"}
              </Button>
            </AppCard>
          )}
  showsVerticalScrollIndicator={false}/>
      ) : (
        <FlatList
          data={rows as ClientServicesAccessRow[]}
          keyExtractor={(item) => item.parentCompanyId}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No client companies found.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: theme.spacing.sm }}>
              <View style={styles.rowBetween}>
                <Typography variant="medium16">{item.name}</Typography>
                <OfferingTypeChip type={item.offeringType} />
              </View>
              <Typography variant="small" muted>
                Reseller: {item.resellerName}
              </Typography>
              <ModuleChips moduleCodes={item.moduleCodes} moduleLabels={moduleLabels} />
              <Typography variant="small" muted>
                {item.websiteCount} websites
              </Typography>
              <Button size="compact" variant="outlined" onPress={() => setViewClient(item)}>
                View
              </Button>
            </AppCard>
          )}
  showsVerticalScrollIndicator={false}/>
      )}

      <ResellerModulesEditModal
        open={Boolean(editReseller)}
        resellerId={editReseller?.resellerId ?? ""}
        resellerName={editReseller?.resellerName}
        canEdit={canEditReseller}
        onClose={() => setEditReseller(null)}
 />

      <ClientServicesDetailModal
        open={Boolean(viewClient)}
        row={viewClient}
        moduleLabels={moduleLabels}
        canEditReseller={canEditReseller}
        onClose={() => setViewClient(null)}
        onEditReseller={(resellerId, resellerName) => {
          setTab("reseller");
          setEditReseller({ resellerId, resellerName });
        }}
 />
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
});
