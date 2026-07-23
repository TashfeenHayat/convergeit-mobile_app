import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useWebsiteAssignmentDetailQuery } from "@/lib/hooks/query/website-assignments/hooks";
import { useWebsiteAssignmentGates } from "@/lib/permissions/use-website-assignment-gates";
import { glassUi } from "@/lib/theme/glass-ui";
import { useAppTheme } from "@/theme";
import { PickWebsiteFields, isPickWebsiteComplete } from "./PickWebsiteFields";
import type { PickWebsitePreset } from "./PickWebsiteModal";

export type AssignWebsitePreset = PickWebsitePreset;

export type AssignWebsiteWorkspaceProps = {
  preset?: AssignWebsitePreset | null;
};

const FLOW_STEPS = [
  { key: "website", title: "Website", subtitle: "Organization & site" },
  { key: "scheduling", title: "Scheduling", subtitle: "Service hours" },
  { key: "roster", title: "Agent roster", subtitle: "Primary / Backup" },
  { key: "complete", title: "Complete", subtitle: "Ready for chat" },
] as const;

/** Assign website agents — step 1 matches web `/website-assigning/assign`. */
export function AssignWebsiteWorkspace({
  preset,
}: AssignWebsiteWorkspaceProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const accent = theme.app.dashboard.accentBlue;
  const [picked, setPicked] = useState<PickWebsitePreset>({
    websiteId: preset?.websiteId ?? "",
    parentCompanyId: preset?.parentCompanyId ?? "",
    childCompanyId: preset?.childCompanyId ?? "",
    resellerId: preset?.resellerId ?? "",
  });

  useEffect(() => {
    if (preset?.websiteId) setPicked(preset);
  }, [preset]);

  const websiteId = picked.websiteId.trim();
  const detailQuery = useWebsiteAssignmentDetailQuery(websiteId, {
    enabled: websiteId.length > 0 && gates.view,
  });
  const detail = detailQuery.data?.data;
  const pickComplete = isPickWebsiteComplete(picked);

  if (!gates.view) {
    return (
      <MobileScreen>
        <AppCard>
          <Typography variant="medium" muted>
            You do not have permission to manage website assignments.
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
       showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Typography variant="boldLarge">Assign website agents</Typography>
            <Typography variant="medium" muted>
              Pick the website, configure the service schedule and agent roster
              — Primary, Secondary, and Backup per topic.
            </Typography>
          </View>
          <Button
            size="compact"
            variant="outlined"
            onPress={() => router.push("/website-assigning" as Href)}
          >
            ← All websites
          </Button>
        </View>

        <View style={styles.stepRow}>
          {FLOW_STEPS.map((step, index) => {
            const active = index === 0;
            return (
              <View
                key={step.key}
                style={[
                  styles.stepCard,
                  {
                    borderColor: active
                      ? accent
                      : theme.app.dashboard.cardBorder,
                    backgroundColor: theme.app.dashboard.overlayLight,
                    opacity: active ? 1 : 0.55,
                  },
                  active && styles.stepCardActive,
                ]}
              >
                <Typography variant="small" muted style={{ fontWeight: "700" }}>
                  {index + 1}
                </Typography>
                <Typography
                  variant="medium"
                  style={{ fontWeight: "700" }}
                  numberOfLines={1}
                >
                  {step.title}
                </Typography>
                <Typography variant="small" muted numberOfLines={2}>
                  {step.subtitle}
                </Typography>
              </View>
            );
          })}
        </View>

        <View
          style={[
            styles.stepBanner,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <View
            style={[
              styles.stepBannerIcon,
              {
                backgroundColor: `${accent}22`,
                borderColor: glassUi.border.subtle,
              },
            ]}
          >
            <Ionicons name="clipboard-outline" size={18} color={accent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="medium16" style={{ fontWeight: "700" }}>
              Step 1 — Select website
            </Typography>
            <Typography variant="small" muted>
              Choose organization and website to begin assignment.
            </Typography>
          </View>
        </View>

        <View
          style={[
            styles.orgCard,
            {
              borderColor: theme.app.dashboard.cardBorder,
              backgroundColor: theme.app.dashboard.overlayLight,
            },
          ]}
        >
          <Typography variant="medium16" style={{ fontWeight: "700" }}>
            1 Organization & website
          </Typography>
          <Typography variant="small" muted>
            Select reseller, parent company, child company, then the website.
          </Typography>
          <PickWebsiteFields
            value={picked}
            onChange={setPicked}
            showProgressChips={false}
            flatLayout
 />
        </View>

        {pickComplete ? (
          detailQuery.isLoading ? (
            <ActivityIndicator color={accent} />
          ) : detailQuery.isError ? (
            <AppCard>
              <Typography variant="medium" color={theme.app.danger}>
                {extractApiErrorMessage(
                  detailQuery.error,
                  "Could not load assignment detail.",
                )}
              </Typography>
            </AppCard>
          ) : detail ? (
            <View style={{ gap: 10 }}>
              <AppCard style={{ gap: 6 }}>
                <Typography variant="medium16" style={{ fontWeight: "700" }}>
                  {detail.url ?? websiteId}
                </Typography>
                <Typography variant="small" muted>
                  {[detail.childCompanyName, detail.parentCompanyName]
                    .filter(Boolean)
                    .join(" · ")}
                </Typography>
              </AppCard>
              <Button
                onPress={() =>
                  router.push(
                    `/website-assigning/website/${encodeURIComponent(websiteId)}/service-scheduling` as Href,
                  )
                }
              >
                Continue to scheduling
              </Button>
              <Button
                variant="outlined"
                onPress={() =>
                  router.push(
                    `/website-assigning/website/${encodeURIComponent(websiteId)}` as Href,
                  )
                }
              >
                Open website detail
              </Button>
            </View>
          ) : null
        ) : null}
      </ScrollView>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 8 },
  scroll: { paddingTop: 4, paddingBottom: 32 },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  stepRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  stepCard: {
    flexGrow: 1,
    flexBasis: "45%",
    minWidth: 140,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 2,
  },
  stepCardActive: {
    borderWidth: 2,
  },
  stepBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  stepBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  orgCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
});
