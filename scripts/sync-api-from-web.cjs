/**
 * Syncs converge_saas_frontend/api → mobile/api with RN-safe filtering.
 * Domain *.api.ts / types copy as-is; browser cookie/http/session cores stay mobile-owned.
 *
 * Usage: node scripts/sync-api-from-web.cjs
 */
const fs = require('fs');
const path = require('path');

const WEB_API = path.resolve(__dirname, '../../converge_saas_frontend/api');
const MOBILE_API = path.resolve(__dirname, '../api');

/** Mobile-owned / already RN-adapted — never overwrite. */
const PRESERVE = new Set([
  'config/index.ts',
  'http/axios-instance.ts',
  'http/public-routes.ts',
  'storage/token-storage.ts',
  'storage/auth-cookies.ts',
  'session/refresh-access-token.ts',
  'session/terminate-auth-session.ts',
  'session/auth-session.sync.ts',
  'auth/auth.api.ts',
  'auth/index.ts',
  'types/auth.types.ts',
  'index.ts',
]);

const SKIP_NAME = /(\.test\.|\.spec\.)/;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(full);
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function rel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function lightRewrite(content) {
  return content
    .replace(/"use client";\s*/g, '')
    .replace(/'use client';\s*/g, '');
}

/**
 * RN adaptation for auth-session lifecycle listeners (window → AppState).
 */
function adaptAuthSessionSync(content) {
  let out = lightRewrite(content);
  // Replace browser lifecycle listeners with AppState
  if (out.includes('window.addEventListener')) {
    out = `import { AppState, type AppStateStatus } from 'react-native';
${out}`;
    out = out.replace(
      /export function attachAuthSessionLifecycleListeners\(\): \(\) => void \{[\s\S]*?\n\}/,
      `export function attachAuthSessionLifecycleListeners(): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const schedule = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      debounce = null;
      void synchronizeAuthSession();
    }, 250);
  };

  const onChange = (next: AppStateStatus) => {
    if (next === 'active') schedule();
  };

  const sub = AppState.addEventListener('change', onChange);
  return () => {
    sub.remove();
    if (debounce) clearTimeout(debounce);
  };
}`,
    );
  }
  return out;
}

const files = walk(WEB_API);
let copied = 0;
let preserved = 0;
let skipped = 0;
let adapted = 0;

for (const src of files) {
  const relative = rel(WEB_API, src);
  if (SKIP_NAME.test(relative)) {
    skipped++;
    continue;
  }
  if (PRESERVE.has(relative)) {
    preserved++;
    continue;
  }

  const dest = path.join(MOBILE_API, relative);
  ensureDir(path.dirname(dest));
  let content = fs.readFileSync(src, 'utf8');

  if (relative === 'session/auth-session.sync.ts') {
    content = adaptAuthSessionSync(content);
    adapted++;
  } else {
    content = lightRewrite(content);
  }

  fs.writeFileSync(dest, content, 'utf8');
  copied++;
}

console.log(
  JSON.stringify(
    {
      copied,
      preserved,
      skipped,
      adapted,
      preserveList: [...PRESERVE],
    },
    null,
    2,
  ),
);
