/**
 * Scaffolds Expo Router screens to mirror converge_saas_frontend/app pages.
 * Run: node scripts/generate-routes-from-web.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(__dirname, '..');
const WEB_APP = path.resolve(MOBILE_ROOT, '../converge_saas_frontend/app');
const DASHBOARD_DIR = path.join(MOBILE_ROOT, 'app', '(dashboard)');
const APP_DIR = path.join(MOBILE_ROOT, 'app');

/** Web routes that stay outside the authenticated dashboard group. */
const PUBLIC_PREFIXES = ['pay', 'rate', 'embed', 'test', 'chat'];

/** Already implemented auth screens — do not overwrite. */
const SKIP_WEB_PREFIXES = ['auth'];

/** Existing hand-written screens — keep exports, do not overwrite. */
const PRESERVE_MOBILE = new Set([
  path.join(DASHBOARD_DIR, 'home.tsx'),
  path.join(DASHBOARD_DIR, '_layout.tsx'),
]);

function walkPages(dir, base = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPages(full, rel));
    } else if (entry.name === 'page.tsx') {
      const route = base.replace(/\\/g, '/');
      if (route) out.push(route);
    }
  }
  return out;
}

function titleFromRoute(route) {
  const parts = route.split('/').filter((p) => p && !p.startsWith('['));
  const last = parts[parts.length - 1] || route;
  return last
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function webPathFor(route) {
  if (route === 'dashboard') return '/dashboard';
  return `/${route}`;
}

function mobileRelPath(webRoute) {
  // dashboard/... → (dashboard)/...
  if (webRoute === 'dashboard') {
    return path.join('(dashboard)', 'home.tsx'); // already exists
  }
  if (webRoute.startsWith('dashboard/')) {
    const rest = webRoute.slice('dashboard/'.length);
    const segments = rest.split('/');
    const file = path.join('(dashboard)', ...segments, 'index.tsx');
    return file;
  }
  if (SKIP_WEB_PREFIXES.some((p) => webRoute === p || webRoute.startsWith(`${p}/`))) {
    return null;
  }
  if (PUBLIC_PREFIXES.some((p) => webRoute === p || webRoute.startsWith(`${p}/`))) {
    const segments = webRoute.split('/');
    return path.join(...segments, 'index.tsx');
  }
  // root landing etc.
  return null;
}

function screenSource({ title, webPath }) {
  return `import { ModulePlaceholderScreen } from '@/features/dashboard';

export default function Screen() {
  return (
    <ModulePlaceholderScreen
      title=${JSON.stringify(title)}
      webPath=${JSON.stringify(webPath)}
    />
  );
}
`;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const routes = walkPages(WEB_APP).sort();
const registry = [];
let created = 0;
let skipped = 0;

for (const route of routes) {
  const rel = mobileRelPath(route);
  if (!rel) {
    skipped++;
    continue;
  }
  if (route === 'dashboard') {
    registry.push({
      webRoute: route,
      href: '/home',
      title: 'Dashboard',
      webPath: '/dashboard',
      group: 'dashboard',
    });
    skipped++;
    continue;
  }

  const abs = path.join(APP_DIR, rel);
  if (PRESERVE_MOBILE.has(abs)) {
    skipped++;
    continue;
  }

  const title = titleFromRoute(route);
  const webPath = webPathFor(route);
  const href = route.startsWith('dashboard/')
    ? `/${route.slice('dashboard/'.length)}`.replace(/\/\[([^\]]+)\]/g, '/:$1')
    : `/${route}`.replace(/\/\[([^\]]+)\]/g, '/:$1');

  // Expo href uses [param] in file system; URL uses actual values. Registry stores pattern path.
  const expoHref = route.startsWith('dashboard/')
    ? `/${route.slice('dashboard/'.length)}`
    : `/${route}`;

  registry.push({
    webRoute: route,
    href: expoHref,
    title,
    webPath,
    group: route.startsWith('dashboard/')
      ? 'dashboard'
      : PUBLIC_PREFIXES.find((p) => route === p || route.startsWith(`${p}/`)) || 'other',
  });

  if (fs.existsSync(abs)) {
    // Only overwrite placeholder-style files; skip if hand-written export pattern differs
    const existing = fs.readFileSync(abs, 'utf8');
    if (
      existing.includes('ModulePlaceholderScreen') ||
      existing.trim() === '' ||
      existing.includes('webPath=')
    ) {
      ensureDir(abs);
      fs.writeFileSync(abs, screenSource({ title, webPath }), 'utf8');
      created++;
    } else {
      skipped++;
    }
  } else {
    ensureDir(abs);
    fs.writeFileSync(abs, screenSource({ title, webPath }), 'utf8');
    created++;
  }
}

const registryPath = path.join(MOBILE_ROOT, 'constants', 'web-route-registry.ts');
const registryBody = `/**
 * Auto-generated mirror of converge_saas_frontend/app routes.
 * Re-run: node scripts/generate-routes-from-web.mjs
 */
export type WebRouteEntry = {
  webRoute: string;
  /** Expo Router path (groups omitted). Dynamic segments keep [param] form. */
  href: string;
  title: string;
  webPath: string;
  group: 'dashboard' | 'pay' | 'rate' | 'embed' | 'test' | 'chat' | 'other';
};

export const WEB_ROUTE_REGISTRY: readonly WebRouteEntry[] = ${JSON.stringify(registry, null, 2)} as const;

export const DASHBOARD_WEB_ROUTES = WEB_ROUTE_REGISTRY.filter((r) => r.group === 'dashboard');

export function titleForHref(href: string): string | undefined {
  const clean = href.split('?')[0]?.replace(/\\/+$/, '') ?? '';
  const exact = WEB_ROUTE_REGISTRY.find((r) => r.href === clean);
  if (exact) return exact.title;
  // Match dynamic patterns: /billing/invoices/[invoiceId]
  for (const r of WEB_ROUTE_REGISTRY) {
    if (!r.href.includes('[')) continue;
    const pattern = r.href.replace(/\\[[^\\]]+\\]/g, '[^/]+');
    if (new RegExp(\`^\${pattern}$\`).test(clean)) return r.title;
  }
  return undefined;
}
`;

fs.writeFileSync(registryPath, registryBody, 'utf8');

console.log(`Routes scanned: ${routes.length}`);
console.log(`Files written/updated: ${created}`);
console.log(`Skipped: ${skipped}`);
console.log(`Registry entries: ${registry.length}`);
console.log(`Wrote ${registryPath}`);
