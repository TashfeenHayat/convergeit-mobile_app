/**
 * Mirrors converge_saas_frontend features/ + components/ into mobile/
 * with React Native–safe transforms. Logic files are copied; TSX gets
 * RN shells that preserve export names so nothing is missing from the tree.
 *
 * Usage: node scripts/port-web-to-mobile.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_ROOT = path.resolve(__dirname, "..");
const WEB_ROOT = path.resolve(MOBILE_ROOT, "..", "converge_saas_frontend");

const SKIP_EXT = new Set([".css", ".md", ".map"]);
const SKIP_NAMES = new Set([".DS_Store"]);

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** @param {string} rel */
function shouldSkip(rel) {
  const ext = path.extname(rel).toLowerCase();
  return SKIP_EXT.has(ext);
}

/**
 * Remap web imports to mobile conventions.
 * @param {string} src
 */
function remapImports(src) {
  let s = src;
  s = s.replace(/from\s+["']@\/components\/common["']/g, 'from "@/components/ui"');
  s = s.replace(/from\s+["']@\/components\/common\//g, 'from "@/components/ui/');
  s = s.replace(/from\s+["']next\/link["']/g, 'from "expo-router"');
  s = s.replace(/from\s+["']next\/navigation["']/g, 'from "expo-router"');
  s = s.replace(/from\s+["']next\/image["']/g, 'from "react-native"');
  s = s.replace(/^\s*["']use client["'];?\s*\n/gm, "");
  s = s.replace(/^\s*["']use server["'];?\s*\n/gm, "");
  return s;
}

/**
 * Detect named + default exports from a TS/TSX source.
 * @param {string} src
 */
function extractExports(src) {
  /** @type {Set<string>} */
  const named = new Set();
  let hasDefault = false;

  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) {
    named.add(m[1]);
  }
  for (const m of src.matchAll(/export\s+(?:const|let|var|class|enum|type|interface)\s+(\w+)/g)) {
    named.add(m[1]);
  }
  for (const m of src.matchAll(/export\s+type\s+\{\s*([^}]+)\s*\}/g)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) named.add(name);
    }
  }
  for (const m of src.matchAll(/export\s+\{\s*([^}]+)\s*\}/g)) {
    for (const part of m[1].split(",")) {
      const cleaned = part.trim();
      if (!cleaned || cleaned.startsWith("type ")) {
        const t = cleaned.replace(/^type\s+/, "").split(/\s+as\s+/).pop()?.trim();
        if (t) named.add(t);
        continue;
      }
      const name = cleaned.split(/\s+as\s+/).pop()?.trim();
      if (name) named.add(name);
    }
  }
  if (/export\s+default\s+/.test(src)) hasDefault = true;

  return { named: [...named], hasDefault };
}

/**
 * True if file is mostly portable logic (no JSX / no MUI).
 * @param {string} rel
 * @param {string} src
 */
function isLogicFile(rel, src) {
  const base = path.basename(rel).toLowerCase();
  if (base.endsWith(".types.ts")) return true;
  if (base.endsWith(".constants.ts")) return true;
  if (base === "keys.ts" || base.endsWith(".keys.ts")) return true;
  if (rel.includes(`${path.sep}types${path.sep}`) || rel.includes("/types/")) return true;
  if (rel.includes(`${path.sep}utils${path.sep}`) || rel.includes("/utils/")) {
    return !src.includes("from \"@mui") && !src.includes("from '@mui") && !/<[A-Z]/.test(src);
  }
  if (base.endsWith(".ts") && !base.endsWith(".tsx")) {
    const hasJsx = /return\s*\([\s\n]*</.test(src) || /<[A-Za-z][\w.]*[\s/>]/.test(src);
    const hasMui = /@mui\//.test(src) || /from\s+["']@emotion/.test(src);
    if (!hasJsx && !hasMui) return true;
  }
  return false;
}

/**
 * Strip MUI / Emotion / next-only imports and leave a note.
 * @param {string} src
 */
function stripWebOnlyImports(src) {
  const lines = src.split("\n");
  const kept = [];
  for (const line of lines) {
    if (/from\s+["']@mui\//.test(line)) continue;
    if (/from\s+["']@emotion\//.test(line)) continue;
    if (/from\s+["']next\//.test(line)) continue;
    if (/import\s+Box\s+from/.test(line) && /@mui/.test(line)) continue;
    kept.push(line);
  }
  return kept.join("\n");
}

/**
 * Build an RN shell that re-exports the same public names.
 * @param {string} rel
 * @param {string} src
 * @param {"feature"|"component"} kind
 */
function buildRnShell(rel, src, kind) {
  const { named, hasDefault } = extractExports(src);
  const componentNames = named.filter(
    (n) =>
      /^[A-Z]/.test(n) &&
      !n.endsWith("Props") &&
      !n.endsWith("Type") &&
      !n.endsWith("Types") &&
      n !== "Props",
  );
  const typeNames = named.filter((n) => !componentNames.includes(n));
  const display = componentNames[0] ?? path.basename(rel, path.extname(rel));
  const webPath =
    kind === "feature"
      ? `features/${rel.replace(/\\/g, "/")}`
      : `components/${rel.replace(/\\/g, "/")}`;

  const lines = [];
  lines.push(`/**`);
  lines.push(` * React Native port shell — source: converge_saas_frontend/${webPath}`);
  lines.push(` * Public exports preserved so the mobile tree mirrors web 1:1.`);
  lines.push(` * Replace shell UI with full RN layout as the feature is productized.`);
  lines.push(` */`);
  lines.push(`import type { ReactNode } from "react";`);
  lines.push(`import { View, StyleSheet } from "react-native";`);
  lines.push(`import { Typography } from "@/components/ui";`);
  lines.push(`import { tokens } from "@/theme/tokens";`);
  lines.push(``);

  for (const t of typeNames) {
    if (/^(type|interface)/.test(t)) continue;
    lines.push(`export type ${t} = Record<string, unknown>;`);
  }

  if (componentNames.length === 0 && !hasDefault) {
    // re-export style objects / consts that were named
    for (const n of named) {
      if (/^[a-z]/.test(n)) {
        lines.push(`export const ${n} = {} as const;`);
      }
    }
    if (named.length === 0) {
      lines.push(`export {};`);
    }
  }

  for (const name of componentNames) {
    lines.push(`export type ${name}Props = {`);
    lines.push(`  children?: ReactNode;`);
    lines.push(`  title?: string;`);
    lines.push(`  [key: string]: unknown;`);
    lines.push(`};`);
    lines.push(``);
    lines.push(`export function ${name}(props: ${name}Props) {`);
    lines.push(`  const label = props.title ?? "${name}";`);
    lines.push(`  return (`);
    lines.push(`    <View style={styles.shell} accessibilityLabel={label}>`);
    lines.push(`      <Typography variant="medium">{label}</Typography>`);
    lines.push(`      {props.children}`);
    lines.push(`    </View>`);
    lines.push(`  );`);
    lines.push(`}`);
    lines.push(``);
  }

  if (hasDefault && componentNames.length === 0) {
    lines.push(`export default function ${display}PortShell() {`);
    lines.push(`  return (`);
    lines.push(`    <View style={styles.shell}>`);
    lines.push(`      <Typography variant="medium">${display}</Typography>`);
    lines.push(`    </View>`);
    lines.push(`  );`);
    lines.push(`}`);
    lines.push(``);
  } else if (hasDefault && componentNames[0]) {
    lines.push(`export default ${componentNames[0]};`);
    lines.push(``);
  }

  lines.push(`const styles = StyleSheet.create({`);
  lines.push(`  shell: {`);
  lines.push(`    padding: tokens.space.md,`);
  lines.push(`    gap: tokens.space.sm,`);
  lines.push(`  },`);
  lines.push(`});`);
  lines.push(``);

  return lines.join("\n");
}

/**
 * Port index / barrel files by remapping imports only.
 * @param {string} src
 */
function portBarrel(src) {
  return remapImports(src);
}

/**
 * @param {string} srcRel relative under features or components
 * @param {string} srcAbs
 * @param {string} destAbs
 * @param {"feature"|"component"} kind
 */
function portFile(srcRel, srcAbs, destAbs, kind) {
  const ext = path.extname(srcAbs).toLowerCase();
  if (shouldSkip(srcRel)) return { action: "skip", srcRel };

  const raw = fs.readFileSync(srcAbs, "utf8");
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });

  const base = path.basename(srcRel).toLowerCase();

  // CSS → empty RN style placeholder (keep path so imports don't 404 conceptually)
  if (ext === ".css") {
    const stub = `import { StyleSheet } from "react-native";\n\n/** Was web CSS: ${srcRel} */\nexport const styles = StyleSheet.create({});\n`;
    const tsDest = destAbs.replace(/\.css$/i, ".styles.ts");
    fs.writeFileSync(tsDest, stub, "utf8");
    return { action: "css→styles", srcRel };
  }

  if (base === "index.ts" || base === "index.tsx") {
    fs.writeFileSync(destAbs, portBarrel(raw), "utf8");
    return { action: "barrel", srcRel };
  }

  if (isLogicFile(srcRel, raw)) {
    let out = remapImports(stripWebOnlyImports(raw));
    // Drop MUI style modules that slipped through
    if (/@mui\//.test(out) || /from\s+["']@emotion/.test(out)) {
      out = buildRnShell(srcRel, raw, kind);
      fs.writeFileSync(destAbs.replace(/\.ts$/, ".tsx").replace(/\.tsx$/, ".tsx"), out, "utf8");
      return { action: "shell-fallback", srcRel };
    }
    fs.writeFileSync(destAbs, out, "utf8");
    return { action: "logic", srcRel };
  }

  // Styles-only TS that uses MUI sx helpers → RN StyleSheet stub
  if (/\.styles\.(ts|tsx)$/i.test(base) || srcRel.includes(`${path.sep}styles${path.sep}`)) {
    const stub = `import { StyleSheet } from "react-native";\nimport { tokens } from "@/theme/tokens";\n\n/** RN stub for web styles: ${srcRel} */\nexport const styles = StyleSheet.create({\n  root: { padding: tokens.space.md },\n});\n\nexport default styles;\n`;
    fs.writeFileSync(destAbs, stub, "utf8");
    return { action: "styles", srcRel };
  }

  // TSX / UI → RN shell preserving exports
  const shell = buildRnShell(srcRel, raw, kind);
  const outPath = destAbs.endsWith(".ts") && raw.includes("export function")
    ? destAbs.replace(/\.ts$/, ".tsx")
    : destAbs;
  // Prefer .tsx for shells with JSX
  const finalPath = outPath.endsWith(".tsx") ? outPath : outPath.replace(/\.ts$/, ".tsx");
  fs.writeFileSync(finalPath, shell, "utf8");
  // If original was .ts but we wrote .tsx, remove confusion
  if (finalPath !== destAbs && fs.existsSync(destAbs) && destAbs !== finalPath) {
    try {
      fs.unlinkSync(destAbs);
    } catch {
      /* ignore */
    }
  }
  return { action: "shell", srcRel };
}

/**
 * Existing hand-ported mobile paths that must never be overwritten.
 */
const PROTECTED_PREFIXES = [
  "features/auth/",
  "features/dashboard/",
  "components/ui/Button",
  "components/ui/ButtonOutline",
  "components/ui/InputField",
  "components/ui/Typography",
  "components/ui/TextLink",
  "components/ui/Checkbox",
  "components/ui/Divider",
  "components/ui/AppCard",
  "components/ui/Label",
  "components/ui/LoadingScreen",
  "components/ui/SplashScreen",
  "components/ui/SegmentedControl",
  "components/ui/SocialAuthButton",
  "components/ui/index",
  "components/auth/",
  "components/app-root/AppProviders",
  "components/layout/MobileScreen",
  "components/layout/ScreenPlaceholder",
  "components/layout/index",
];

/** @param {string} destAbs */
function isProtected(destAbs) {
  const rel = path.relative(MOBILE_ROOT, destAbs).split(path.sep).join("/");
  return PROTECTED_PREFIXES.some(
    (p) => rel === p || rel.startsWith(p) || rel.startsWith(p + ".") || rel.replace(/\.(tsx|ts)$/, "") === p,
  );
}

/**
 * web components/common/Foo/Foo.tsx → components/ui/Foo.tsx (flat)
 * web components/common/Foo/index.ts → skip (barrel merged later)
 * other folders map 1:1 under components/
 * @param {string} relPosix
 */
function mapComponentDest(relPosix) {
  if (relPosix === "common" || relPosix.startsWith("common/")) {
    const rest = relPosix === "common" ? "" : relPosix.slice("common/".length);
    if (!rest) return null;
    const parts = rest.split("/");
    // common/index.ts → handled separately
    if (parts.length === 1 && parts[0].startsWith("index.")) return null;
    // common/Foo/Foo.tsx or Foo.types.ts → ui/Foo.tsx | ui/Foo.types.ts
    if (parts.length >= 2) {
      const folder = parts[0];
      const file = parts[parts.length - 1];
      // nested helpers e.g. SearchBar/SearchSubmitButton.tsx → ui/SearchBar/SearchSubmitButton.tsx
      if (parts.length > 2 || (file !== `${folder}.tsx` && file !== `${folder}.ts` && !file.startsWith(folder))) {
        return path.join("ui", ...parts);
      }
      return path.join("ui", file);
    }
    // common/Foo.tsx rare flat file
    return path.join("ui", parts[0]);
  }
  return relPosix;
}

function bump(stats, key) {
  if (key in stats) stats[key]++;
  else stats.other++;
}

function main() {
  const stats = {
    feature: { logic: 0, shell: 0, barrel: 0, styles: 0, skip: 0, protected: 0, other: 0 },
    component: { logic: 0, shell: 0, barrel: 0, styles: 0, skip: 0, protected: 0, other: 0 },
  };

  // --- features ---
  const webFeatures = path.join(WEB_ROOT, "features");
  const mobileFeatures = path.join(MOBILE_ROOT, "features");
  const featureFiles = walk(webFeatures);
  console.log(`Porting ${featureFiles.length} feature files...`);

  for (const abs of featureFiles) {
    const rel = path.relative(webFeatures, abs);
    const dest = path.join(mobileFeatures, rel);
    if (isProtected(dest)) {
      stats.feature.protected++;
      continue;
    }
    const result = portFile(rel, abs, dest, "feature");
    const key = result.action.startsWith("shell")
      ? "shell"
      : result.action === "logic"
        ? "logic"
        : result.action === "barrel"
          ? "barrel"
          : result.action === "styles" || result.action.startsWith("css")
            ? "styles"
            : result.action === "skip"
              ? "skip"
              : "other";
    bump(stats.feature, key);
  }

  // --- components ---
  const webComponents = path.join(WEB_ROOT, "components");
  const mobileComponents = path.join(MOBILE_ROOT, "components");
  const componentFiles = walk(webComponents);
  console.log(`Porting ${componentFiles.length} component files...`);

  for (const abs of componentFiles) {
    const rel = path.relative(webComponents, abs);
    const relPosix = rel.split(path.sep).join("/");
    const mapped = mapComponentDest(relPosix);
    if (mapped == null) {
      stats.component.skip++;
      continue;
    }
    const dest = path.join(mobileComponents, ...mapped.split("/"));
    if (isProtected(dest)) {
      stats.component.protected++;
      continue;
    }
    // Don't clobber an existing hand-written ui file
    if (
      mapped.startsWith("ui/") &&
      fs.existsSync(dest) &&
      !fs.readFileSync(dest, "utf8").includes("Port shell")
    ) {
      stats.component.protected++;
      continue;
    }
    const result = portFile(rel, abs, dest, "component");
    const key = result.action.startsWith("shell")
      ? "shell"
      : result.action === "logic"
        ? "logic"
        : result.action === "barrel"
          ? "barrel"
          : result.action === "styles" || result.action.startsWith("css")
            ? "styles"
            : result.action === "skip"
              ? "skip"
              : "other";
    bump(stats.component, key);
  }

  console.log("\n=== Port complete ===");
  console.log("features:", stats.feature);
  console.log("components:", stats.component);
  console.log(`\nMobile features root: ${mobileFeatures}`);
  console.log(`Mobile components root: ${mobileComponents}`);
}

main();
