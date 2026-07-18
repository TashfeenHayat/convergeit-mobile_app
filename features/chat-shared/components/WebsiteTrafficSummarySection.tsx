import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useQuery } from "@tanstack/react-query";
import { AppCard, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { ChatScopeFiltersToolbar } from "./ChatScopeFiltersToolbar";
import { useChatScopeFilters } from "../hooks/useChatScopeFilters";
import { fetchWebsiteLeadsSummary } from "@/services/chat/website-analytics.api";

const DATE_RANGE_DAYS: Record<string, number> = {
  "Last 7 Days": 7,
  "Last 30 Days": 30,
  "Last 90 Days": 90,
};

function formatStatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function resolveDateRange(label: string): { from: string; to: string } {
  const days = DATE_RANGE_DAYS[label] ?? 30;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: formatStatDate(from), to: formatStatDate(to) };
}

type WebsiteTrafficSummarySectionProps = {
  dateRangeLabel: string;
};

function formatCount(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString() : "—";
}

export function WebsiteTrafficSummarySection({ dateRangeLabel }: WebsiteTrafficSummarySectionProps) {
  const scope = useChatScopeFilters(undefined);
  const websiteId = scope.filters.websiteId.trim();
  const range = useMemo(() => resolveDateRange(dateRangeLabel), [dateRangeLabel]);

  const summaryQuery = useQuery({
    queryKey: ["website-leads-summary", websiteId, range.from, range.to],
    queryFn: () => fetchWebsiteLeadsSummary({ websiteId, from: range.from, to: range.to }),
    enabled: Boolean(websiteId),
    staleTime: 60_000,
  });

  const totals = (summaryQuery.data?.totals ?? {}) as Record<string, unknown>;

  const stats = [
    {
      icon: "users" as const,
      title: "Unique visitors",
      value: formatCount(totals.totalTraffic),
      subtitle: `${formatCount(totals.totalPageViews)} page views`,
      color: tokens.colors.accentBlue,
    },
    {
      icon: "line-chart" as const,
      title: "Widget opens",
      value: formatCount(totals.widgetOpened),
      subtitle: "Launcher opened",
      color: "#A855F7",
    },
    {
      icon: "comment" as const,
      title: "Chats started",
      value: formatCount(totals.totalChats),
      subtitle: `${formatCount(totals.meaningfulChats)} meaningful (QA)`,
      color: tokens.colors.accentGreen,
    },
    {
      icon: "globe" as const,
      title: "Leads captured",
      value: formatCount(totals.leadsCaptured),
      subtitle: `${formatCount(totals.chatsWithoutLead)} chats without lead`,
      color: tokens.colors.accentOrange,
    },
  ];

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <FontAwesome name="globe" size={16} color="#22D3EE" />
          <Typography variant="label" style={{ fontWeight: "600" }}>
            Website traffic & chats
          </Typography>
        </View>
        <ChatScopeFiltersToolbar
          filters={scope.filters}
          onPatch={scope.patchFilters}
          onReset={scope.resetFilters}
          canFilterByResellerId={scope.canFilterByResellerId}
          resellerOptions={scope.resellerOptions}
          parentCompanyOptions={scope.parentCompanyOptions}
          childCompanyOptions={scope.childCompanyOptions}
          websiteOptions={scope.websiteOptions}
          title="Website traffic filters"
          hint={`Select a website to load totals for ${dateRangeLabel.toLowerCase()}.`}
        />
      </View>
      <Typography variant="small" muted style={{ marginBottom: tokens.space.md }}>
        Live analytics via socket (REST fallback). Use Filter to choose reseller, company, and website scope.
      </Typography>

      {!websiteId ? (
        <Typography variant="medium" muted>
          Choose a website in Filter to view visitor and chat metrics.
        </Typography>
      ) : summaryQuery.isLoading ? (
        <Typography variant="medium" muted>
          Loading analytics…
        </Typography>
      ) : summaryQuery.isError ? (
        <Typography variant="medium" color={tokens.colors.danger}>
          Could not load website analytics. Check report permissions and try again.
        </Typography>
      ) : (
        <View style={styles.grid}>
          {stats.map((s) => (
            <View key={s.title} style={styles.tile}>
              <View style={[styles.tileIcon, { backgroundColor: `${s.color}26` }]}>
                <FontAwesome name={s.icon} size={16} color={s.color} />
              </View>
              <Typography variant="small" muted style={{ marginTop: 8 }}>
                {s.title}
              </Typography>
              <Typography variant="mediumLarge" style={{ fontWeight: "700", color: "#22D3EE" }}>
                {s.value}
              </Typography>
              <Typography variant="small" muted numberOfLines={1}>
                {s.subtitle}
              </Typography>
            </View>
          ))}
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: tokens.space.md,
    marginBottom: tokens.space.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    marginBottom: tokens.space.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.space.sm,
    flex: 1,
    minWidth: 0,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: tokens.space.sm,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: tokens.space.md,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
