import { StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import type { SocialUiPlatform } from "../social-media.constants";
import { getSocialPlatformMeta } from "../social-platform-meta";

export type SocialMediaPlatformLogoProps = {
  platform: SocialUiPlatform;
  size?: number;
};

const ICON_BY_PLATFORM: Record<SocialUiPlatform, keyof typeof Ionicons.glyphMap> = {
  facebook: "logo-facebook",
  instagram: "logo-instagram",
};

export function SocialMediaPlatformLogo({ platform, size = 40 }: SocialMediaPlatformLogoProps) {
  const meta = getSocialPlatformMeta(platform);
  const accent = meta?.accent ?? "#5865F2";

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: `${accent}26` },
      ]}
    >
      <Ionicons name={ICON_BY_PLATFORM[platform]} size={size * 0.55} color={accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: "center", justifyContent: "center" },
});
