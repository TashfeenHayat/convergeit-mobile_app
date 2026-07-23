import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { AppCard, Button, SearchBar, Typography } from "@/components/ui";
import { MobileScreen } from "@/components/layout";
import { useAppTheme } from "@/theme";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth";
import { OP } from "@/lib/permissions/operational-keys";
import { formatConnectedDate, type SocialMediaConnectionItem } from "@/api/social-media/social-media.api";
import { useSocialMediaConnectionsQuery, useDeleteSocialMediaConnectionMutation } from "../hooks/useSocialMediaQueries";
import { SocialMediaPlatformLogo } from "../components/SocialMediaPlatformLogo";
import type { SocialUiPlatform } from "../social-media.constants";

function apiPlatformToUi(platform: string): SocialUiPlatform {
  return platform.startsWith("instagram") ? "instagram" : "facebook";
}

export function SocialMediaListPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const { hasOperational } = useAuth();
  const canManage = hasOperational(OP.socialMedia.create) || hasOperational(OP.socialMedia.delete);

  const [search, setSearch] = useState("");
  const query = useSocialMediaConnectionsQuery({ search: search.trim() || undefined, limit: 100 });
  const deleteMutation = useDeleteSocialMediaConnectionMutation();

  const items = useMemo(() => query.data?.items ?? [], [query.data]);

  const onDisconnect = (item: SocialMediaConnectionItem) => {
    Alert.alert("Disconnect account?", `Remove ${item.accountName ?? item.platformLabel} from ${item.websiteName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () =>
          deleteMutation.mutate(item.id, {
            onError: (err) => Alert.alert("Could not disconnect", extractApiErrorMessage(err)),
          }),
      },
    ]);
  };

  return (
    <MobileScreen scroll={false} contentStyle={styles.screen}>
      <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <Typography variant="boldLarge">Social integrations</Typography>
        <Typography variant="medium" muted>
          Facebook and Instagram messaging connections by website.
        </Typography>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by website, account…" />
        {canManage ? (
          <Button onPress={() => router.push("/integrations/add" as never)}>Connect account</Button>
        ) : null}
      </View>

      {query.isLoading ? (
        <ActivityIndicator color={theme.app.dashboard.accentBlue} style={{ marginTop: 24 }} />
      ) : query.isError ? (
        <AppCard>
          <Typography variant="medium" color={theme.app.danger}>
            {extractApiErrorMessage(query.error, "Could not load connections.")}
          </Typography>
        </AppCard>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: 24 }}
          ListEmptyComponent={
            <AppCard>
              <Typography variant="medium" muted>
                No social accounts connected yet.
              </Typography>
            </AppCard>
          }
          renderItem={({ item }) => (
            <AppCard style={{ gap: 8 }}>
              <View style={styles.row}>
                <SocialMediaPlatformLogo platform={apiPlatformToUi(item.platform)} size={40} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="medium16">{item.accountName ?? item.platformLabel}</Typography>
                  <Typography variant="small" muted>
                    {item.platformLabel} · {item.websiteName}
                  </Typography>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor:
                        item.status === "active" ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.14)",
                    },
                  ]}
                >
                  <Typography
                    variant="small"
                    color={item.status === "active" ? theme.app.dashboard.accentGreen : theme.app.danger}
                  >
                    {item.status}
                  </Typography>
                </View>
              </View>
              <Typography variant="small" muted>
                Connected {formatConnectedDate(item.connectedDate)} · {item.clientOf}
              </Typography>
              {canManage ? (
                <Button size="compact" variant="danger" onPress={() => onDisconnect(item)}>
                  Disconnect
                </Button>
              ) : null}
            </AppCard>
          )}
  showsVerticalScrollIndicator={false}/>
      )}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
