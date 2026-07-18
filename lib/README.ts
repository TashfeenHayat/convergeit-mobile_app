/**
 * Mobile `lib/` mirrors `converge_saas_frontend/lib/` folder-for-folder.
 *
 * ## Layout (same as web)
 * ai, app-boundaries, auth, billing, chat, chat-widget, companies, constants,
 * dashboard, dashboard-appearance, design-system, hooks, hrms, mui,
 * notifications, notify, permissions, products, public-api, routing,
 * safe-markdown, theme, ui, users, utils, website-assignments, websites,
 * widget-runtime (+ mobile `lib/api`)
 *
 * ## RN readiness
 * - **Active (typechecked):** auth, permissions, hooks/query/{auth,core},
 *   notify, app-boundaries, routing, constants, utils/core, api errors
 * - **Scaffolded (on disk, not in tsc include until domain APIs land):**
 *   billing, chat, chat-widget, companies, hrms, …
 *
 * Sync pure modules from web:
 * ```bash
 * npm run sync:lib
 * ```
 *
 * Do not import Next/MUI-only modules on native without an RN adapter.
 * `npm run sync:lib` preserves mobile-owned files listed in scripts/sync-lib-from-web.cjs.
 */
export {};
