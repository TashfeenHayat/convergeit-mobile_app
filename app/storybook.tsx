/**
 * Storybook route — Metro swaps the entry:
 * - default: metro-shims/storybook-entry.js (redirect home)
 * - STORYBOOK_ENABLED=1: metro-shims/storybook-entry-active.js (real UI)
 */
export { default } from '../metro-shims/storybook-entry';
