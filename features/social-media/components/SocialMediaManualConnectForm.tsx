import { useState } from "react";
import { Alert, View } from "react-native";

import { Button, InputField, Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { extractApiErrorMessage } from "@/lib/api/errors";
import { uiPlatformToApi } from "@/api/social-media/social-media.api";
import { useCreateSocialMediaConnectionMutation } from "../hooks/useSocialMediaQueries";
import type { SocialUiPlatform } from "../social-media.constants";

export type SocialMediaManualConnectFormProps = {
  websiteId: string;
  platform: SocialUiPlatform;
  onSuccess?: () => void;
};

/** Advanced fallback when OAuth is unavailable — paste Page ID + long-lived token. */
export function SocialMediaManualConnectForm({
  websiteId,
  platform,
  onSuccess,
}: SocialMediaManualConnectFormProps) {
  const createMutation = useCreateSocialMediaConnectionMutation();
  const [accountName, setAccountName] = useState("");
  const [externalAccountId, setExternalAccountId] = useState("");
  const [pageId, setPageId] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleSave = () => {
    if (!websiteId.trim()) {
      Alert.alert("Website required", "Select a website first.");
      return;
    }
    if (!externalAccountId.trim()) {
      Alert.alert("Page ID required", "Enter the Page ID.");
      return;
    }
    if (!accessToken.trim()) {
      Alert.alert("Access token required", "Paste a long-lived Meta access token.");
      return;
    }
    createMutation.mutate(
      {
        websiteId: websiteId.trim(),
        platform: uiPlatformToApi(platform),
        externalAccountId: externalAccountId.trim(),
        accountName: accountName.trim() || undefined,
        pageId: pageId.trim() || externalAccountId.trim(),
        instagramId: instagramId.trim() || undefined,
        accessToken: accessToken.trim(),
      },
      {
        onSuccess: () => {
          Alert.alert("Connected", "Social account connected.");
          onSuccess?.();
        },
        onError: (err) => Alert.alert("Could not connect", extractApiErrorMessage(err)),
      },
    );
  };

  return (
    <View style={{ gap: tokens.space.md }}>
      {platform === "facebook" ? (
        <>
          <InputField label="Page name" value={accountName} onChangeText={setAccountName} />
          <InputField label="Page ID" value={externalAccountId} onChangeText={setExternalAccountId} />
        </>
      ) : null}
      {platform === "instagram" ? (
        <>
          <InputField label="Account name" value={accountName} onChangeText={setAccountName} />
          <InputField label="Page ID" value={pageId} onChangeText={setPageId} />
          <InputField label="Instagram ID" value={instagramId} onChangeText={setInstagramId} />
          <InputField
            label="External account ID (Page ID)"
            value={externalAccountId}
            onChangeText={setExternalAccountId}
          />
        </>
      ) : null}
      <InputField
        label="Access token"
        value={accessToken}
        onChangeText={setAccessToken}
        secureTextEntry
        helperText="Long-lived Meta access token with messaging permissions."
      />
      <Button disabled={createMutation.isPending} loading={createMutation.isPending} onPress={handleSave}>
        Save connection
      </Button>
      <Typography variant="small" muted>
        Use only when OAuth is unavailable.
      </Typography>
    </View>
  );
}
