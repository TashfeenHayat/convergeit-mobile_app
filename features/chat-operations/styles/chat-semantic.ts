import { tokens } from "@/theme/tokens";

export type ChatSemanticTone = "canned" | "ai" | "whisper" | "info" | "warning" | "muted";

function accentForTone(tone: ChatSemanticTone): string {
  switch (tone) {
    case "canned":
    case "info":
    case "ai":
      return tokens.colors.accentBlue;
    case "whisper":
      return "#A855F7";
    case "warning":
      return tokens.colors.accentOrange;
    case "muted":
    default:
      return tokens.colors.textMuted;
  }
}

/** Tinted surface color set for tool panels, alerts, and chips (RN inline-style friendly). */
export function chatSemanticSurface(tone: ChatSemanticTone) {
  const accent = accentForTone(tone);
  const subtle = tone === "muted" || tone === "ai";
  return {
    accent,
    borderColor: `${accent}${subtle ? "38" : "61"}`,
    backgroundColor: `${accent}${subtle ? "0F" : "1F"}`,
    labelColor: tone === "muted" ? tokens.colors.textMuted : accent,
  };
}
