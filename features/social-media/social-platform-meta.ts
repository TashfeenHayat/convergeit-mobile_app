import type { SocialUiPlatform } from "./social-media.constants";

export type SocialPlatformMeta = {
  code: SocialUiPlatform;
  name: string;
  subtitle: string;
  blurb: string;
  accent: string;
  connectLabel: string;
  oauthSupported: boolean;
};

export const SOCIAL_PLATFORM_META: Record<SocialUiPlatform, SocialPlatformMeta> = {
  facebook: {
    code: "facebook",
    name: "Facebook",
    subtitle: "Messenger",
    blurb: "Route Page Messenger chats to your agent inbox.",
    accent: "#1877F2",
    connectLabel: "Connect with Meta",
    oauthSupported: true,
  },
  instagram: {
    code: "instagram",
    name: "Instagram",
    subtitle: "Direct messages",
    blurb: "Requires an Instagram Business account linked to your Facebook Page.",
    accent: "#E1306C",
    connectLabel: "Connect with Meta",
    oauthSupported: true,
  },
};

export function getSocialPlatformMeta(code?: string | null): SocialPlatformMeta | null {
  if (!code?.trim()) return null;
  const key = code.trim().toLowerCase() as SocialUiPlatform;
  return SOCIAL_PLATFORM_META[key] ?? null;
}
