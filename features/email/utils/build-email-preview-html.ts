import type { EmailTemplateBlock } from "../types";
import { EMAIL_TEMPLATE_SAMPLE_DATA } from "../constants/email-sample-data";
import type { EmailAgentFeedbackPreview } from "./email-html-builder";
import { buildEmailHtml } from "./email-html-builder";
import { normalizeEmailTheme, type EmailTemplateTheme } from "./email-theme";

export function buildClientEmailPreviewHtml(input: {
  primaryColor: string;
  theme: EmailTemplateTheme | unknown;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  blocks: EmailTemplateBlock[];
  platformHeaderUrl?: string;
  feedback?: EmailAgentFeedbackPreview;
}): string {
  const theme = normalizeEmailTheme(input.theme);
  const accent = input.primaryColor?.trim() || "#1a57a5";
  const platformHeaderUrl =
    input.platformHeaderUrl?.trim() || "/uploads/platform/email-header.png";

  return buildEmailHtml({
    theme,
    accent,
    logoUrl: input.logoUrl,
    bannerUrl: input.bannerUrl,
    platformHeaderUrl,
    blocks: input.blocks.map((b) => ({
      blockKey: b.blockKey,
      enabled: b.enabled,
      sortOrder: b.sortOrder,
      styleJson: (b.styleJson as Record<string, unknown> | null) ?? null,
    })),
    sample: EMAIL_TEMPLATE_SAMPLE_DATA,
    feedback: input.feedback,
  });
}
