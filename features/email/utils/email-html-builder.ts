import type { EmailTemplateBlockKey } from "../constants/email-template-blocks";
import {
  EMAIL_BLOCK_FIELD_CATALOG,
  readBlockStyleJson,
  type EmailBlockFieldDef,
  type EmailFieldIconStyle,
} from "../constants/email-block-fields";
import {
  filterFieldsByEmailForm,
  isEmailBlockAllowedByForm,
} from "../constants/email-form-field-map";
import { renderFieldIconSvg } from "../constants/email-field-icon-library";
import type {
  EmailSectionHeaderStyle,
  EmailTemplateThemeJson,
} from "./email-theme";

export type EmailSampleData = {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  company: string;
  location: string;
  timezone: string;
  sessionId: string;
  website: string;
  chatTime: string;
  agentName: string;
  duration: string;
  browser: string;
  os: string;
  visitorId: string;
  device: string;
  ip: string;
  leadSource: string;
  chatOrigin: string;
  referrer: string;
  landingPage: string;
  currentPage: string;
  sessionStartedAt: string;
  chatId: string;
  transcript: { who: string; line: string }[];
  journey: string[];
  additionalNotes?: string;
};

export type RenderEmailBlockInput = {
  blockKey: string;
  enabled: boolean;
  sortOrder: number;
  styleJson: Record<string, unknown> | null;
};

export type EmailAgentFeedbackPreview = {
  ratingEnabled: boolean;
  goodLabel: string;
  poorLabel: string;
  ratingRequired?: boolean;
  notesEnabled: boolean;
  notesPlaceholder: string;
  notesSubmitLabel: string;
  notesRequired?: boolean;
};

export type EmailFeedbackLinks = {
  goodUrl: string;
  poorUrl: string;
  noteUrl?: string;
};

export function buildEmailHtml(input: {
  theme: EmailTemplateThemeJson;
  accent: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  platformHeaderUrl: string;
  blocks: RenderEmailBlockInput[];
  sample: EmailSampleData;
  feedback?: EmailAgentFeedbackPreview;
  feedbackLinks?: EmailFeedbackLinks;
  /** When set (live email per website), only fields enabled in Email forms are rendered. */
  enabledFormFieldKeys?: ReadonlySet<string> | null;
}): string {
  const {
    theme,
    accent,
    logoUrl,
    bannerUrl,
    platformHeaderUrl,
    blocks,
    sample,
    feedback,
    feedbackLinks,
    enabledFormFieldKeys,
  } = input;
  const bg = theme.backgroundColor ?? "#eef2f7";
  const contentBg = theme.contentBackground ?? "#ffffff";
  const text = theme.textColor ?? "#1e293b";

  const parts: string[] = [
    `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:20px 10px;font-family:Arial,Helvetica,sans-serif;background:${escAttr(bg)};color:${escAttr(text)};">`,
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;margin:0 auto;background:${escAttr(contentBg)};border-radius:4px;overflow:hidden;box-shadow:0 2px 12px rgba(15,23,42,0.1);">`,
    renderHeader(theme, accent, logoUrl, bannerUrl, platformHeaderUrl),
  ];

  const sorted = [...blocks].sort((a, b) => a.sortOrder - b.sortOrder);

  for (const block of sorted) {
    if (!block.enabled || block.blockKey === "footer") continue;
    const key = block.blockKey as EmailTemplateBlockKey;
    if (!isEmailBlockAllowedByForm(key, enabledFormFieldKeys)) continue;
    const html = renderBlock(
      key,
      accent,
      theme,
      sample,
      block.styleJson,
      feedback,
      enabledFormFieldKeys,
      feedbackLinks,
    );
    if (html) parts.push(html);
  }

  const footerBlock = blocks.find((b) => b.blockKey === "footer");
  if (!footerBlock || footerBlock.enabled) {
    const footerStyle = footerBlock
      ? readBlockStyleJson(footerBlock.styleJson, "footer")
      : readBlockStyleJson(null, "footer");
    parts.push(renderFooter(theme, accent, footerStyle.title));
  }

  parts.push(`</table></body></html>`);
  return parts.join("");
}

function renderHeader(
  theme: EmailTemplateThemeJson,
  accent: string,
  logoUrl: string | null | undefined,
  bannerUrl: string | null | undefined,
  platformHeaderUrl: string,
): string {
  const layout = theme.headerLayout ?? "hero_banner";
  const logoPos = theme.logoPosition ?? "below_banner";
  const parts: string[] = [];

  const logoRow = (padding: string) =>
    logoUrl && logoPos !== "hidden" && logoPos !== "on_banner"
      ? `<tr><td style="padding:${padding};text-align:center;background:${escAttr(theme.contentBackground ?? "#fff")};"><img src="${escAttr(logoUrl)}" alt="Logo" style="max-height:56px;display:inline-block;" /></td></tr>`
      : "";

  if (layout === "hero_banner" || layout === "custom_banner") {
    if (logoPos === "above_banner") parts.push(logoRow("16px 24px 8px"));

    const title = theme.bannerTitle?.trim() || "New Web Chat Alert";
    const subtitle = theme.bannerSubtitle?.trim();
    const titleSize = theme.bannerTitleFontSize ?? 22;
    const overlay = theme.bannerOverlayColor ?? "#0f2744";
    const opacity = theme.bannerOverlayOpacity ?? 0.55;
    const titleColor = theme.bannerTextColor ?? "#ffffff";
    const bgStyle = bannerUrl
      ? `background-image:url('${escAttr(bannerUrl)}');background-size:cover;background-position:center;`
      : `background:linear-gradient(135deg,${escAttr(accent)},${escAttr(overlay)});`;

    parts.push(`<tr><td style="padding:0;${bgStyle}height:140px;vertical-align:middle;">`);
    parts.push(
      `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="height:140px;background-color:rgba(${hexToRgb(overlay)},${opacity});">`,
    );
    parts.push(`<tr><td style="padding:32px 24px;text-align:center;vertical-align:middle;">`);
    if (logoUrl && logoPos === "on_banner") {
      parts.push(
        `<img src="${escAttr(logoUrl)}" alt="Logo" style="max-height:40px;margin-bottom:10px;display:inline-block;" /><br/>`,
      );
    }
    parts.push(
      `<div style="color:${escAttr(titleColor)};font-size:${titleSize}px;font-weight:700;letter-spacing:0.02em;line-height:1.25;">${escHtml(title)}</div>`,
    );
    if (subtitle) {
      parts.push(
        `<div style="color:${escAttr(titleColor)};font-size:14px;margin-top:8px;opacity:0.9;">${escHtml(subtitle)}</div>`,
      );
    }
    parts.push(`</td></tr></table></td></tr>`);

    if (logoPos === "below_banner") parts.push(logoRow("16px 24px 8px"));
  } else if (layout === "logo_bar") {
    parts.push(
      `<tr><td style="padding:20px 24px;background:${escAttr(accent)};text-align:center;">`,
      logoUrl
        ? `<img src="${escAttr(logoUrl)}" alt="Logo" style="max-height:64px;display:inline-block;" />`
        : `<span style="color:#fff;font-size:20px;font-weight:700;">Your brand</span>`,
      `</td></tr>`,
    );
  } else if (layout === "minimal") {
    if (logoUrl && logoPos !== "hidden") parts.push(logoRow("20px 24px 12px"));
  } else {
    if (theme.showPlatformHeader !== false) {
      parts.push(
        `<tr><td style="padding:0;"><img src="${escAttr(platformHeaderUrl)}" alt="" width="640" style="display:block;width:100%;max-width:640px;height:auto;" /></td></tr>`,
      );
    }
    if (bannerUrl) {
      parts.push(
        `<tr><td style="padding:0;"><img src="${escAttr(bannerUrl)}" alt="" width="640" style="display:block;width:100%;max-width:640px;height:auto;" /></td></tr>`,
      );
    }
    if (logoUrl && logoPos !== "hidden") parts.push(logoRow("16px 24px 4px"));
  }

  const tagline = theme.headerTagline?.trim();
  if (tagline) {
    parts.push(
      `<tr><td style="padding:8px 24px 12px;font-size:14px;color:${escAttr(theme.mutedTextColor ?? "#64748b")};">${escHtml(tagline)}</td></tr>`,
    );
  }

  return parts.join("");
}

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "15,39,68";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function renderFooter(theme: EmailTemplateThemeJson, accent: string, sectionTitle?: string): string {
  const bg = theme.footerBackground ?? accent;
  const color = theme.footerTextColor ?? "#ffffff";
  const lines: string[] = [];
  if (sectionTitle?.trim()) {
    lines.push(
      `<div style="font-weight:700;font-size:14px;margin-bottom:10px;">${escHtml(sectionTitle.trim())}</div>`,
    );
  }
  if (theme.footerCompanyName?.trim()) {
    lines.push(
      `<div style="font-weight:600;margin-bottom:6px;">${escHtml(theme.footerCompanyName.trim())}</div>`,
    );
  }
  if (theme.footerNote?.trim()) {
    lines.push(`<div>${escHtml(theme.footerNote.trim())}</div>`);
  }
  if (theme.footerSupportEmail?.trim()) {
    lines.push(
      `<div style="margin-top:8px;">Support: <a href="mailto:${escAttr(theme.footerSupportEmail.trim())}" style="color:#bae6fd;">${escHtml(theme.footerSupportEmail.trim())}</a></div>`,
    );
  }
  if (theme.showPoweredBy) {
    lines.push(`<div style="margin-top:10px;font-size:11px;opacity:0.85;">Powered by Conver</div>`);
  }
  return `<tr><td style="padding:16px 24px;background:${escAttr(bg)};color:${escAttr(color)};font-size:12px;text-align:center;line-height:1.5;">${lines.join("")}</td></tr>`;
}

function sectionTitle(
  title: string,
  accent: string,
  style: EmailSectionHeaderStyle,
): string {
  if (style === "underline") {
    return `<tr><td style="padding:14px 24px 6px;border-bottom:3px solid ${escAttr(accent)};"><span style="font-weight:700;font-size:15px;color:${escAttr(accent)};">${escHtml(title)}</span></td></tr>`;
  }
  if (style === "pill") {
    return `<tr><td style="padding:14px 24px 6px;"><span style="display:inline-block;background:${escAttr(accent)};color:#fff;padding:6px 14px;border-radius:999px;font-weight:700;font-size:13px;">${escHtml(title)}</span></td></tr>`;
  }
  return `<tr><td style="background:${escAttr(accent)};color:#fff;padding:10px 16px;font-weight:700;font-size:14px;letter-spacing:0.02em;">${escHtml(title)}</td></tr>`;
}

function fieldCell(
  label: string,
  value: string,
  iconHtml: string,
  accent: string,
  muted: string,
  text: string,
): string {
  const iconCol = iconHtml
    ? `<td style="width:28px;vertical-align:top;padding-top:2px;color:${escAttr(accent)};font-size:15px;line-height:1;">${iconHtml}</td>`
    : "";
  return `<table cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr>${iconCol}<td style="vertical-align:top;font-size:13px;color:${escAttr(muted)};line-height:1.45;"><strong style="color:${escAttr(muted)};">${escHtml(label)}:</strong><br/><span style="color:${escAttr(text)};">${escHtml(value)}</span></td></tr></table>`;
}

function resolveFieldIconHtml(
  field: EmailBlockFieldDef,
  iconStyle: EmailFieldIconStyle,
  showIcons: boolean,
  accent: string,
): string {
  if (!showIcons || iconStyle === "minimal") return "";
  if (iconStyle === "mui") return renderFieldIconSvg(field.iconKey, accent);
  return field.icons[iconStyle] || field.icons.emoji;
}

function renderFieldsBlock(
  blockKey: EmailTemplateBlockKey,
  accent: string,
  theme: EmailTemplateThemeJson,
  sample: EmailSampleData,
  styleJson: Record<string, unknown> | null,
  enabledFormFieldKeys?: ReadonlySet<string> | null,
): string {
  const style = readBlockStyleJson(styleJson, blockKey);
  const iconStyle = style.iconStyle ?? theme.globalIconStyle ?? "mui";
  const catalog = EMAIL_BLOCK_FIELD_CATALOG[blockKey];
  const visible = filterFieldsByEmailForm(blockKey, catalog, enabledFormFieldKeys);
  if (visible.length === 0) return "";
  const sectionStyle = theme.sectionHeaderStyle ?? "bar";
  const muted = theme.mutedTextColor ?? "#475569";
  const text = theme.textColor ?? "#1e293b";

  const parts: string[] = [sectionTitle(style.title, accent, sectionStyle)];

  if (style.layout === "grid" && style.columns === 2) {
    parts.push(`<tr><td style="padding:12px 16px 16px;"><table width="100%" cellpadding="0" cellspacing="0" role="presentation">`);
    for (let i = 0; i < visible.length; i += 2) {
      const left = visible[i];
      const right = visible[i + 1];
      const leftVal = String((sample as Record<string, unknown>)[left.sampleKey] ?? "—");
      const leftIcon = resolveFieldIconHtml(left, iconStyle, style.showIcons, accent);
      parts.push(`<tr>`);
      parts.push(
        `<td width="50%" style="padding:6px 8px;vertical-align:top;">${fieldCell(left.label, leftVal, leftIcon, accent, muted, text)}</td>`,
      );
      if (right) {
        const rightVal = String((sample as Record<string, unknown>)[right.sampleKey] ?? "—");
        const rightIcon = resolveFieldIconHtml(right, iconStyle, style.showIcons, accent);
        parts.push(
          `<td width="50%" style="padding:6px 8px;vertical-align:top;">${fieldCell(right.label, rightVal, rightIcon, accent, muted, text)}</td>`,
        );
      } else {
        parts.push(`<td width="50%"></td>`);
      }
      parts.push(`</tr>`);
    }
    parts.push(`</table></td></tr>`);
  } else {
    for (const field of visible) {
      const val = String((sample as Record<string, unknown>)[field.sampleKey] ?? "—");
      const icon = resolveFieldIconHtml(field, iconStyle, style.showIcons, accent);
      parts.push(
        `<tr><td style="padding:10px 24px;border-bottom:1px solid #e2e8f0;">${fieldCell(field.label, val, icon, accent, muted, text)}</td></tr>`,
      );
    }
  }

  return parts.join("");
}

function renderBlock(
  blockKey: EmailTemplateBlockKey,
  accent: string,
  theme: EmailTemplateThemeJson,
  sample: EmailSampleData,
  styleJson: Record<string, unknown> | null,
  feedback?: EmailAgentFeedbackPreview,
  enabledFormFieldKeys?: ReadonlySet<string> | null,
  feedbackLinks?: EmailFeedbackLinks,
): string {
  const style = readBlockStyleJson(styleJson, blockKey);
  const sectionStyle = theme.sectionHeaderStyle ?? "bar";

  if (
    blockKey === "visitor_info" ||
    blockKey === "chat_info" ||
    blockKey === "acquisition"
  ) {
    return renderFieldsBlock(
      blockKey,
      accent,
      theme,
      sample,
      styleJson,
      enabledFormFieldKeys,
    );
  }

  switch (blockKey) {
    case "transcript":
      return [
        sectionTitle(style.title, accent, sectionStyle),
        ...sample.transcript.map(
          (t) =>
            `<tr><td style="padding:12px 24px;font-size:13px;border-bottom:1px solid #e2e8f0;line-height:1.5;"><strong style="color:${escAttr(accent)};">${escHtml(t.who)}:</strong> ${escHtml(t.line)}</td></tr>`,
        ),
      ].join("");
    case "additional_notes": {
      if (feedback && !feedback.notesEnabled) return "";
      const submitLabel = feedback?.notesSubmitLabel?.trim() || "Submit note";
      const noteHref = feedbackLinks?.noteUrl ?? "#";
      const agentNote = sample.additionalNotes?.trim();
      return [
        sectionTitle(style.title, accent, sectionStyle),
        `<tr><td style="padding:12px 24px 16px;">`,
        agentNote
          ? `<div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;font-size:13px;color:#475569;line-height:1.5;margin-bottom:12px;">${escHtml(agentNote)}</div>`
          : `<div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:6px;padding:12px 14px;font-size:12px;color:#64748b;line-height:1.5;margin-bottom:12px;">Agent wrap-up notes appear here when submitted.</div>`,
        `<div style="text-align:right;">`,
        `<a href="${escAttr(noteHref)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 20px;background:${escAttr(accent)};color:#ffffff;border-radius:6px;text-decoration:none;font-weight:700;font-size:13px;">${escHtml(submitLabel)}</a>`,
        `</div></td></tr>`,
      ].join("");
    }
    case "visitor_feedback": {
      if (feedback && !feedback.ratingEnabled) return "";
      const good = feedback?.goodLabel?.trim() || "Good";
      const poor = feedback?.poorLabel?.trim() || "Poor";
      const goodHref = feedbackLinks?.goodUrl ?? "#";
      const poorHref = feedbackLinks?.poorUrl ?? "#";
      const btn = (href: string, emoji: string, label: string, bg: string, border: string) =>
        `<td style="padding:0 16px;text-align:center;"><a href="${escAttr(href)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;"><div style="width:52px;height:52px;border-radius:50%;background:${bg};border:2px solid ${border};line-height:52px;font-size:26px;">${emoji}</div><div style="font-size:12px;color:#64748b;margin-top:6px;font-weight:600;">${escHtml(label)}</div></a></td>`;
      return [
        sectionTitle(style.title, accent, sectionStyle),
        `<tr><td style="padding:16px 24px 20px;text-align:center;">`,
        `<table cellpadding="0" cellspacing="0" role="presentation" align="center"><tr>`,
        btn(goodHref, "&#128077;", good, "#dcfce7", "#22c55e"),
        btn(poorHref, "&#128078;", poor, "#fee2e2", "#ef4444"),
        `</tr></table></td></tr>`,
      ].join("");
    }
    case "visitor_journey":
      return [
        sectionTitle(style.title, accent, sectionStyle),
        ...sample.journey.map((j, i) => {
          const badge = `<span style="display:inline-block;width:22px;height:22px;border-radius:50%;background:${escAttr(accent)};color:#fff;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:10px;">${i + 1}</span>`;
          return `<tr><td style="padding:10px 24px;font-size:13px;border-bottom:1px solid #e2e8f0;line-height:1.5;">${badge}${escHtml(j)}</td></tr>`;
        }),
      ].join("");
    default:
      return "";
  }
}

function escAttr(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
}

function escHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
