import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";

import { AppCard, SelectField, Typography } from "@/components/ui";
import { useAppTheme } from "@/theme";
import { MobileScreen } from "@/components/layout/MobileScreen";
import { useSocialMediaWizardScope } from "../hooks/useSocialMediaWizardScope";
import { SocialMediaPlatformPicker } from "../components/SocialMediaPlatformPicker";
import { SocialMediaSelectedScopeBanner } from "../components/SocialMediaSelectedScopeBanner";
import { SocialMetaOAuthConnectButton } from "../components/SocialMetaOAuthConnectButton";
import { SocialMediaManualConnectForm } from "../components/SocialMediaManualConnectForm";
import { getSocialPlatformMeta } from "../social-platform-meta";
import type { SocialUiPlatform } from "../social-media.constants";

export function SocialMediaConnectPage() {
  const theme = useAppTheme();
  const router = useRouter();
  const scope = useSocialMediaWizardScope();
  const [platform, setPlatform] = useState<SocialUiPlatform | "">("");
  const [manualFallback, setManualFallback] = useState(false);

  const websiteLabel = useMemo(
    () => scope.websiteOptions.find((o) => o.value === scope.websiteId)?.label,
    [scope.websiteOptions, scope.websiteId],
  );

  const platformMeta = getSocialPlatformMeta(platform || undefined);
  const readyToConnect = Boolean(scope.websiteId.trim() && platform);

  return (
    <MobileScreen contentStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
      <View style={{ gap: 4 }}>
        <Typography variant="boldLarge">Connect a social account</Typography>
        <Typography variant="medium" muted>
          Choose the website, then the platform to connect via Meta.
        </Typography>
      </View>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <Typography variant="medium16">1. Website</Typography>
        {scope.canFilterByResellerId ? (
          <SelectField
            label="Reseller"
            value={scope.resellerId}
            onChange={(v) => {
              scope.setResellerId(v);
              scope.setParentCompanyId("");
              scope.setChildCompanyId("");
              scope.setWebsiteId("");
            }}
            options={[{ label: "Select reseller", value: "" }, ...scope.resellerOptions]}
            searchable={false}
          />
        ) : null}
        <SelectField
          label="Parent company"
          value={scope.parentCompanyId}
          onChange={(v) => {
            scope.setParentCompanyId(v);
            scope.setChildCompanyId("");
            scope.setWebsiteId("");
          }}
          options={[{ label: "Select parent company", value: "" }, ...scope.parentCompanyOptions]}
          searchable={false}
        />
        <SelectField
          label="Child company"
          value={scope.childCompanyId}
          onChange={(v) => {
            scope.setChildCompanyId(v);
            scope.setWebsiteId("");
          }}
          options={[{ label: "Select child company", value: "" }, ...scope.childCompanyOptions]}
          searchable={false}
          disabled={!scope.parentCompanyId.trim()}
        />
        <SelectField
          label="Website"
          value={scope.websiteId}
          onChange={scope.setWebsiteId}
          options={[{ label: "Select website", value: "" }, ...scope.websiteOptions]}
          searchable={false}
          disabled={!scope.childCompanyId.trim()}
        />
        {scope.loading ? <ActivityIndicator color={theme.app.dashboard.accentBlue} /> : null}
      </AppCard>

      <AppCard style={{ gap: theme.spacing.sm }}>
        <Typography variant="medium16">2. Platform</Typography>
        <SocialMediaPlatformPicker value={platform} onChange={setPlatform} />
      </AppCard>

      {readyToConnect ? (
        <View style={{ gap: theme.spacing.sm }}>
          <SocialMediaSelectedScopeBanner
            websiteLabel={websiteLabel ?? "Selected website"}
            platform={platform || null}
          />

          {!manualFallback ? (
            <View style={{ gap: 8 }}>
              <SocialMetaOAuthConnectButton websiteId={scope.websiteId} platform={platform as SocialUiPlatform} />
              {platformMeta && !platformMeta.oauthSupported ? null : (
                <Typography
                  variant="small"
                  muted
                  onPress={() => setManualFallback(true)}
                  style={{ textAlign: "center" }}
                >
                  Having trouble? Connect manually instead
                </Typography>
              )}
            </View>
          ) : (
            <AppCard style={{ gap: theme.spacing.sm }}>
              <Typography variant="medium16">Manual connection</Typography>
              <SocialMediaManualConnectForm
                websiteId={scope.websiteId}
                platform={platform as SocialUiPlatform}
                onSuccess={() => router.back()}
              />
            </AppCard>
          )}
        </View>
      ) : null}
    </MobileScreen>
  );
}
