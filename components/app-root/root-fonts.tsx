/**
 * Web Google Fonts helpers — unused on React Native (Expo fonts load in app/_layout).
 * Constants preserved for import parity with the web tree.
 */
export const ROOT_FONT_FAMILY_CSS =
  '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const GOOGLE_FONTS_STYLESHEET_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

export function rootFontFamilyCss(): string {
  return ROOT_FONT_FAMILY_CSS;
}

export function shouldLoadGoogleFontsStylesheet(): boolean {
  return false;
}
