import { View } from "react-native";

import { AppCard, Typography } from "@/components/ui";
import type { SocialUiPlatform } from "../social-media.constants";
import { getSocialPlatformMeta } from "../social-platform-meta";
import { SocialMediaPlatformLogo } from "./SocialMediaPlatformLogo";

export type SocialMediaSelectedScopeBannerProps = {
  websiteLabel?: string;
  hierarchyLabel?: string;
  platform?: SocialUiPlatform | null;
  note?: string;
};

export function SocialMediaSelectedScopeBanner({
  websiteLabel = "Website selected",
  hierarchyLabel,
  platform,
  note = "One active connection per platform per website.",
}: SocialMediaSelectedScopeBannerProps) {
  const platformMeta = getSocialPlatformMeta(platform ?? undefined);

  return (
    <AppCard style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
      {platformMeta ? (
        <SocialMediaPlatformLogo platform={platformMeta.code} size={44} />
      ) : null}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Typography variant="small" muted>
          {platformMeta ? `${platformMeta.name} · ${platformMeta.subtitle}` : "Selected scope"}
        </Typography>
        <Typography variant="medium16">{websiteLabel}</Typography>
        {hierarchyLabel ? (
          <Typography variant="small" muted>
            {hierarchyLabel}
          </Typography>
        ) : null}
        <Typography variant="small" muted>
          {note}
        </Typography>
      </View>
    </AppCard>
  );
}
