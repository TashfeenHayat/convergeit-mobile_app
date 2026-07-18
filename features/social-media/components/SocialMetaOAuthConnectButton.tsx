import { useState } from "react";
import { Alert, Linking } from "react-native";

import { Button } from "@/components/ui";
import { uiPlatformToApi } from "@/api/social-media/social-media.api";
import { useStartMetaOAuthMutation } from "../hooks/useSocialMediaQueries";
import type { SocialUiPlatform } from "../social-media.constants";
import { getSocialPlatformMeta } from "../social-platform-meta";

export type SocialMetaOAuthConnectButtonProps = {
  websiteId: string;
  platform: SocialUiPlatform;
  disabled?: boolean;
};

export function SocialMetaOAuthConnectButton({
  websiteId,
  platform,
  disabled,
}: SocialMetaOAuthConnectButtonProps) {
  const oauthMutation = useStartMetaOAuthMutation();
  const [loading, setLoading] = useState(false);
  const meta = getSocialPlatformMeta(platform);
  const label = meta?.connectLabel ?? "Connect with Meta";

  const handleConnect = async () => {
    if (!websiteId.trim()) {
      Alert.alert("Select a website first.");
      return;
    }
    setLoading(true);
    try {
      const { authorizeUrl } = await oauthMutation.mutateAsync({
        websiteId: websiteId.trim(),
        platform: uiPlatformToApi(platform),
      });
      if (!authorizeUrl) {
        Alert.alert("Meta OAuth is not configured.");
        return;
      }
      await Linking.openURL(authorizeUrl);
    } catch {
      Alert.alert("Could not start Meta OAuth.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button fullWidth disabled={disabled || loading} loading={loading} onPress={() => void handleConnect()}>
      {loading ? "Redirecting…" : label}
    </Button>
  );
}
