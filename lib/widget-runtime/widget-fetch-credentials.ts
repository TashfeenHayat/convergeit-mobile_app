/**
 * Widget HTTP must never send dashboard session cookies (visitor JWT in Authorization only).
 * On React Native there are no browser cookies; keep `omit` for web/Expo web parity.
 */
export const WIDGET_FETCH_CREDENTIALS = "omit" as const;
