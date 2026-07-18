import type { EmailTemplateBlock } from "../types";
import type { EmailTemplateBlockKey } from "../constants/email-template-blocks";
import { DEFAULT_TEMPLATE_BLOCKS } from "../email.constants";
import {
  DEFAULT_BLOCK_STYLE,
  type EmailBlockStyleJson,
  type EmailFieldIconStyle,
} from "../constants/email-block-fields";

export type { EmailBlockStyleJson, EmailFieldIconStyle };

export function readBlockStyle(block: EmailTemplateBlock): EmailBlockStyleJson {
  const raw = block.styleJson;
  if (!raw || typeof raw !== "object") return { ...DEFAULT_BLOCK_STYLE[block.blockKey] };
  const { hiddenFields: _hidden, ...rest } = raw as EmailBlockStyleJson;
  return {
    ...DEFAULT_BLOCK_STYLE[block.blockKey],
    ...rest,
  };
}

export function patchBlockStyle(
  block: EmailTemplateBlock,
  patch: Partial<EmailBlockStyleJson>,
): EmailTemplateBlock {
  const merged = { ...readBlockStyle(block), ...patch };
  const { hiddenFields: _hidden, iconStyle, ...rest } = merged;
  const styleJson: EmailBlockStyleJson = { ...rest };
  if (iconStyle !== undefined) {
    styleJson.iconStyle = iconStyle;
  }
  if ("iconStyle" in patch && patch.iconStyle === undefined) {
    return { ...block, styleJson };
  }
  return { ...block, styleJson };
}

/** Drop per-block icon override so the template global icon style applies in preview/email. */
export function clearBlockIconOverride(block: EmailTemplateBlock): EmailTemplateBlock {
  const merged = readBlockStyle(block);
  const { iconStyle: _removed, ...rest } = merged;
  return { ...block, styleJson: rest };
}

/** When global icon style changes, reset blocks that were following the previous global default. */
export function syncBlocksWithGlobalIconStyle(
  blocks: EmailTemplateBlock[],
  previousGlobal: EmailFieldIconStyle,
): EmailTemplateBlock[] {
  return blocks.map((block) => {
    const style = readBlockStyle(block);
    if (style.iconStyle != null && style.iconStyle !== previousGlobal) {
      return block;
    }
    return clearBlockIconOverride(block);
  });
}

export function defaultStyleForBlock(blockKey: EmailTemplateBlockKey): EmailBlockStyleJson {
  const base = DEFAULT_BLOCK_STYLE[blockKey];
  return {
    ...base,
    title: undefined,
  };
}

export function mergeTemplateBlocks(blocks: EmailTemplateBlock[] | undefined): EmailTemplateBlock[] {
  const byKey = new Map((blocks ?? []).map((b) => [b.blockKey, b]));
  return DEFAULT_TEMPLATE_BLOCKS.map((blockKey, index) => {
    const existing = byKey.get(blockKey);
    if (existing) {
      const raw = existing.styleJson;
      const cleaned =
        raw && typeof raw === "object"
          ? (() => {
              const { hiddenFields: _h, ...rest } = raw as EmailBlockStyleJson;
              return rest;
            })()
          : defaultStyleForBlock(blockKey);
      return {
        ...existing,
        styleJson: cleaned,
      };
    }
    return {
      blockKey,
      enabled: true,
      sortOrder: (index + 1) * 10,
      styleJson: defaultStyleForBlock(blockKey),
    };
  });
}
