import type { PickWebsitePreset } from "@/features/website-assignments/components/PickWebsiteModal";
import { SOCIAL_PLATFORMS, type SocialUiPlatform } from "./social-media.constants";

/**
 * RN has no `sessionStorage`; the connect flow lives on one screen at a time,
 * so an in-memory module store (cleared via `clearSocialMediaWizardDraft`) is
 * sufficient — no AsyncStorage persistence needed across app restarts.
 */
let draftWebsite: PickWebsitePreset | null = null;
let draftPlatform: SocialUiPlatform | null = null;

function isSocialPlatform(raw: string): raw is SocialUiPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(raw);
}

export function readSocialMediaWizardWebsite(): PickWebsitePreset | null {
  if (!draftWebsite?.childCompanyId?.trim() || !draftWebsite?.websiteId?.trim()) return null;
  return draftWebsite;
}

export function writeSocialMediaWizardWebsite(preset: PickWebsitePreset): void {
  draftWebsite = preset;
}

export function readSocialMediaWizardPlatform(): SocialUiPlatform | null {
  const raw = draftPlatform?.trim().toLowerCase();
  if (raw && isSocialPlatform(raw)) return raw;
  return null;
}

export function writeSocialMediaWizardPlatform(platform: SocialUiPlatform | null): void {
  draftPlatform = platform;
}

export function clearSocialMediaWizardDraft(): void {
  draftWebsite = null;
  draftPlatform = null;
}
