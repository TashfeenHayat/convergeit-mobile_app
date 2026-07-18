import { Pressable, StyleSheet, View } from "react-native";

import { Typography } from "@/components/ui";
import { tokens } from "@/theme/tokens";
import { SOCIAL_PLATFORMS, type SocialUiPlatform } from "../social-media.constants";
import { getSocialPlatformMeta } from "../social-platform-meta";
import { SocialMediaPlatformLogo } from "./SocialMediaPlatformLogo";

export type SocialMediaPlatformPickerProps = {
  value: SocialUiPlatform | "";
  onChange: (platform: SocialUiPlatform) => void;
};

export function SocialMediaPlatformPicker({ value, onChange }: SocialMediaPlatformPickerProps) {
  return (
    <View style={styles.grid}>
      {SOCIAL_PLATFORMS.map((platform) => {
        const selected = value === platform;
        const meta = getSocialPlatformMeta(platform);
        if (!meta) return null;

        return (
          <Pressable
            key={platform}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(platform)}
            style={[styles.card, selected && styles.cardSelected]}
          >
            <View style={styles.cardHeader}>
              <SocialMediaPlatformLogo platform={platform} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Typography variant="medium16">{meta.name}</Typography>
                <Typography variant="small" muted>
                  {meta.subtitle}
                </Typography>
                {selected ? (
                  <Typography variant="small" color={tokens.colors.accentBlue}>
                    Selected
                  </Typography>
                ) : null}
              </View>
            </View>
            <Typography variant="small" muted>
              {meta.blurb}
            </Typography>
            {!meta.oauthSupported ? (
              <Typography variant="small" color={tokens.colors.accentOrange}>
                Manual setup
              </Typography>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: tokens.space.sm },
  card: {
    borderRadius: tokens.radius.lg,
    borderWidth: 1,
    borderColor: tokens.colors.cardBorder,
    padding: tokens.space.lg,
    gap: 8,
  },
  cardSelected: {
    borderColor: tokens.colors.accentBlue,
    backgroundColor: `${tokens.colors.accentBlue}14`,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
});
