import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { MobileScreen } from "@/components/layout";
import { AppCard, Button, Typography } from "@/components/ui";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useWebsiteAssignmentGates } from "@/lib/permissions/use-website-assignment-gates";
import {
  useWebsiteAssignmentDetailQuery,
  useWebsiteAssignmentsWebsitesQuery,
} from "@/lib/hooks/query/website-assignments/hooks";
import { useAppTheme } from "@/theme";
import { PickWebsiteFields, isPickWebsiteComplete } from "./PickWebsiteFields";
import type { PickWebsitePreset } from "./PickWebsiteModal";

export type AssignWebsitePreset = PickWebsitePreset;

export type AssignWebsiteWorkspaceProps = {
  preset?: AssignWebsitePreset | null;
};

/** Mobile website assignment workspace — pick website, view roster status. */
export function AssignWebsiteWorkspace({ preset }: AssignWebsiteWorkspaceProps) {
  const theme = useAppTheme();
  const router = useRouter();
  const gates = useWebsiteAssignmentGates();
  const [picked, setPicked] = useState<PickWebsitePreset>({
    websiteId: preset?.websiteId ?? "",
    parentCompanyId: preset?.parentCompanyId ?? "",
    childCompanyId: preset?.childCompanyId ?? "",
    resellerId: preset?.resellerId ?? "",
  });

  useEffect(() => {
    if (preset?.websiteId) setPicked(preset);
  }, [preset]);

  const websitesQuery = useWebsiteAssignmentsWebsitesQuery(
    {
      all: true,
      parentCompanyId: picked.parentCompanyId || undefined,
      childCompanyId: picked.childCompanyId || undefined,
      resellerId: picked.resellerId || undefined,
    },
    { enabled: Boolean(picked.parentCompanyId.trim()) },
  );

  const websiteId = picked.websiteId.trim();
  const detailQuery = useWebsiteAssignmentDetailQuery(websiteId, {
    enabled: websiteId.length > 0 && gates.view,
  });

  const websites = websitesQuery.data?.data?.items ?? [];
  const detail = detailQuery.data?.data;

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
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <Typography variant="boldLarge">Assign website</Typography>
        <Typography variant="medium" muted>
          Pick a website to review assignment status and rosters.
        </Typography>
        <PickWebsiteFields value={picked} onChange={setPicked} />
      </View>

      {!isPickWebsiteComplete(picked) ? (
        <AppCard>
          <Typography variant="medium" muted>
            Select reseller, parent company, and website to continue.
          </Typography>
        </AppCard>
      ) : detailQuery.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} />
      ) : detailQuery.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(detailQuery.error, "Could not load assignment detail.")}
          </Typography>
        </AppCard>
      ) : detail ? (
        <View style={{ gap: theme.spacing.md }}>
          <AppCard style={{ gap: 8 }}>
            <Typography variant="medium16">{detail.url ?? websiteId}</Typography>
            <Typography variant="small" muted>
              {detail.childCompanyName} · {detail.parentCompanyName}
            </Typography>
            <Typography variant="small" muted>
              Service scheduling: {detail.serviceSchedulingConfigured ? "Configured" : "Not set"}
            </Typography>
            <Typography variant="small" muted>
              Visitor topics: {detail.visitorTopicsConfigured ? "Configured" : "Not set"}
            </Typography>
            <Typography variant="small" muted>
              Departments with roster: {detail.departmentRoster?.length ?? 0}
            </Typography>
          </AppCard>

          <View style={{ gap: 8 }}>
            <Button
              variant="outlined"
              onPress={() => router.push(`/website-assigning/website/${websiteId}` as never)}
            >
              Open website detail
            </Button>
            <Button
              variant="outlined"
              onPress={() =>
                router.push(`/website-assigning/website/${websiteId}/service-scheduling` as never)
              }
            >
              Service scheduling
            </Button>
            <Button
              variant="outlined"
              onPress={() =>
                router.push(`/website-assigning/website/${websiteId}/inquire-topics` as never)
              }
            >
              Inquire topics
            </Button>
            <Button
              variant="outlined"
              onPress={() =>
                Alert.alert(
                  "Full roster editor",
                  "Department roster editing is available on the web dashboard.",
                )
              }
            >
              Edit rosters (web)
            </Button>
          </View>
        </View>
      ) : (
        <FlatList
          data={websites}
          keyExtractor={(item) => item.websiteId}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No websites in this scope.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                setPicked((p) => ({
                  ...p,
                  websiteId: item.websiteId,
                }))
              }
            >
              <AppCard style={{ gap: 4 }}>
                <Typography variant="medium16">{item.url ?? item.websiteId}</Typography>
                <Typography variant="small" muted>
                  {(item.filledSlots ?? item.assignedCount) > 0 ? "Has assignments" : "Unassigned"}
                </Typography>
              </AppCard>
            </Pressable>
          )}
        />
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingTop: 12 },
});
