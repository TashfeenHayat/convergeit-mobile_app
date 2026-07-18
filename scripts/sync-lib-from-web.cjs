/**
 * Syncs converge_saas_frontend/lib → mobile/lib with RN-safe filtering.
 * Pure TS modules are copied; Next/MUI/DOM-heavy files get stubs.
 */
const fs = require('fs');
const path = require('path');

const WEB_LIB = path.resolve(__dirname, '../../converge_saas_frontend/lib');
const MOBILE_LIB = path.resolve(__dirname, '../lib');

const BLOCK_IMPORT = /from\s+["'](next\/|@mui\/|@emotion\/|react-dom|js-cookie|nookies)/;
const BLOCK_NAME = /(\.test\.|\.spec\.|AuthContext\.tsx$|useAuthRealtimeBridge|token-cross-tab|mui\/)/;

const TOP_LEVEL = [
  'ai',
  'app-boundaries',
  'auth',
  'billing',
  'chat',
  'chat-widget',
  'companies',
  'constants',
  'dashboard',
  'dashboard-appearance',
  'design-system',
  'hooks',
  'hrms',
  'mui',
  'notifications',
  'notify',
  'permissions',
  'products',
  'public-api',
  'routing',
  'safe-markdown',
  'theme',
  'ui',
  'users',
  'utils',
  'website-assignments',
  'websites',
  'widget-runtime',
];

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

function isBlocked(filePath, content) {
  const norm = filePath.split(path.sep).join('/');
  if (BLOCK_NAME.test(norm)) return true;
  if (BLOCK_IMPORT.test(content)) return true;
  // Skip Next client directive-only heavy UI hooks that need DOM
  if (content.includes('"use client"') && /document\.|window\.|localStorage|sessionStorage/.test(content)) {
    // allow if we can adapt later — still copy pure logic with storage
    if (/document\.|window\./.test(content) && !content.includes('typeof window')) {
      return true;
    }
  }
  return false;
}

function stubFor(relPath) {
  return `/**
 * RN stub — web module \`${relPath}\` depends on Next/MUI/DOM.
 * Re-implement against React Native APIs when this domain is ported.
 */
export {};
`;
}

function domainIndexStub(name) {
  return `/**
 * \`@/lib/${name}\` — mirrored from converge_saas_frontend/lib/${name}.
 * Platform: React Native (Expo). Import concrete modules from subpaths.
 */
export {};
`;
}

// Ensure top-level domains exist
for (const name of TOP_LEVEL) {
  ensureDir(path.join(MOBILE_LIB, name));
  const idx = path.join(MOBILE_LIB, name, 'index.ts');
  if (!fs.existsSync(idx) && name !== 'auth' && name !== 'hooks') {
    // will rewrite after copy
  }
}

const files = walk(WEB_LIB);
let copied = 0;
let stubbed = 0;
let skipped = 0;

// Preserve mobile-owned files
const PRESERVE = new Set([
  'auth/AuthProvider.tsx',
  'auth/AuthContext.tsx',
  'auth/auth-form-validation.ts',
  'auth/auth-paths.ts',
  'auth/feature-flags.ts',
  'auth/password-reset-session.ts',
  'auth/impersonation-session.ts',
  'auth/index.ts',
  'hooks/index.ts',
  'hooks/useDashboardActivityNavItems.ts',
  'hooks/query/index.ts',
  'hooks/query/auth/index.ts',
  'hooks/query/auth/hooks.ts',
  'hooks/query/auth/keys.ts',
  'hooks/query/core/query-client.ts',
  'hooks/query/core/query-provider.tsx',
  'permissions/index.ts',
  'api/errors.ts',
  'README.ts',
]);

for (const src of files) {
  const relative = rel(WEB_LIB, src);
  if (PRESERVE.has(relative.replace(/\\/g, '/'))) {
    skipped++;
    continue;
  }

  const dest = path.join(MOBILE_LIB, relative);
  ensureDir(path.dirname(dest));
  const content = fs.readFileSync(src, 'utf8');

  if (isBlocked(src, content)) {
    // Don't overwrite existing preserved/custom files with stubs if already good
    if (!fs.existsSync(dest) || fs.readFileSync(dest, 'utf8').startsWith('/**\n * RN stub')) {
      fs.writeFileSync(dest, stubFor(relative.replace(/\\/g, '/')), 'utf8');
      stubbed++;
    } else {
      skipped++;
    }
    continue;
  }

  // Light rewrite: next/navigation → expo-router where simple
  let out = content
    .replace(/"use client";\s*/g, '')
    .replace(/from ["']next\/navigation["']/g, "from 'expo-router'");

  fs.writeFileSync(dest, out, 'utf8');
  copied++;
}

// Domain index files for empty-ish domains
for (const name of TOP_LEVEL) {
  const dir = path.join(MOBILE_LIB, name);
  const idx = path.join(dir, 'index.ts');
  if (name === 'auth' || name === 'hooks' || name === 'permissions') continue;
  if (!fs.existsSync(idx)) {
    // collect exports from non-stub ts files in dir (top level only)
    const entries = fs
      .readdirSync(dir)
      .filter((f) => /\.(ts|tsx)$/.test(f) && f !== 'index.ts' && !f.includes('.test.'));
    if (entries.length === 0) {
      fs.writeFileSync(idx, domainIndexStub(name), 'utf8');
    } else {
      const exports = entries
        .map((f) => {
          const base = f.replace(/\.(ts|tsx)$/, '');
          const body = fs.readFileSync(path.join(dir, f), 'utf8');
          if (body.includes('RN stub')) return null;
          return `export * from './${base}';`;
        })
        .filter(Boolean);
      fs.writeFileSync(
        idx,
        exports.length
          ? `/** Mirrored from converge_saas_frontend/lib/${name} */\n${exports.join('\n')}\n`
          : domainIndexStub(name),
        'utf8',
      );
    }
  }
}

console.log(
  JSON.stringify(
    { copied, stubbed, skipped, preserve: PRESERVE.size, topLevel: TOP_LEVEL.length },
    null,
    2,
  ),
);
